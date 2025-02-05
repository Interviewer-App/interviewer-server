import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from "@nestjs/common";
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCategoryAssignmentDto } from "./dto/update-category-assignment.dto";
import { CreateCategoryAssignmentDto } from "./dto/create-category-assignment.dto";
import { UpdateCategoryScoreDto } from "./dto/update-category-score.dto";

@Injectable()
export class CategoryService {

  private readonly logger = new Logger('InterviewService');

  constructor(
    private prisma: PrismaService
  ) { }

  async create(dto: CreateCategoryDto) {
    this.logger.log(`POST: Category/create: New Category creating started`);

    try {
      const company = await this.prisma.company.findUnique({
        where: { companyID: dto.companyId },
      });
      if (!company) {
        throw new NotFoundException(`Company with id ${dto.companyId} not found`);
      }

      const category = await this.prisma.category.create({
        data: {
          companyId: dto.companyId,
          categoryName: dto.categoryName,
          description: dto.description,
        },
      });


      this.logger.log(
        `POST: Category/create: Category ${category.categoryId} created successfully`
      );

      return {
        message: "Category created successfully",
        category,
      };
    } catch (error) {
      // Custom Prisma error handler
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.prismaErrorHandler(error, "POST", dto.companyId);
      this.logger.error(`POST: Question/create: Error: ${error.message}`);
      throw new InternalServerErrorException("Server error occurred");
    }
  }

  async findAll(companyId: string, page: number, limit: number) {
    this.logger.log(`GET: Category/findAll: Fetching categories for company ID ${companyId}`);

    try {
      const skip = (page - 1) * limit;
      const take = Number(limit);

      const categories = await this.prisma.category.findMany({
        skip,
        take,
        where: { companyId: companyId }, // Filter by companyId
        select: {
          categoryId: true,
          companyId: true,
          categoryName: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!categories || categories.length === 0) {
        this.logger.warn(`GET: No categories found for company ID: ${companyId}`);
        throw new NotFoundException(`No categories found for company ID: ${companyId}`);
      }

      const total = await this.prisma.category.count({
        where: { companyId: companyId },
      });

      this.logger.log(`GET: Category/findAll: Fetched ${categories.length} categories for company ID ${companyId}`);

      return {
        categories,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`GET: Category/findAll: Error: ${error.message}`);
      throw new InternalServerErrorException("Server error occurred");
    }
  }

  async findOne(id: string) {
    this.logger.log(`GET: Category/findOne: Fetching category with ID ${id}`);

    try {
      const category = await this.prisma.category.findUnique({
        where: { categoryId: id },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      this.logger.log(`GET: Category/findOne: Category ${id} fetched successfully`);
      return {
        message: "Category fetched successfully",
        category,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.prismaErrorHandler(error, "GET", id);
      this.logger.error(`GET: Category/findOne: Error: ${error.message}`);
      throw new InternalServerErrorException("Server error occurred");
    }
  }

  async update(id: string, dto: UpdateCategoryDto) {
    this.logger.log(`PUT: Category/update: Updating category with ID ${id}`);

    try {
      const category = await this.prisma.category.findUnique({
        where: { categoryId: id },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      const updatedCategory = await this.prisma.category.update({
        where: { categoryId: id },
        data: {
          categoryName: dto.categoryName,
          description: dto.description,
        },
      });

      this.logger.log(`PUT: Category/update: Category ${id} updated successfully`);
      return {
        message: "Category updated successfully",
        category: updatedCategory,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.prismaErrorHandler(error, "PUT", id);
      this.logger.error(`PUT: Category/update: Error: ${error.message}`);
      throw new InternalServerErrorException("Server error occurred");
    }
  }

  async remove(id: string) {
    this.logger.log(`DELETE: Category/remove: Deleting category with ID ${id}`);

    try {
      const category = await this.prisma.category.findUnique({
        where: { categoryId: id },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      await this.prisma.category.delete({
        where: { categoryId: id },
      });

      this.logger.log(`DELETE: Category/remove: Category ${id} deleted successfully`);
      return {
        message: "Category deleted successfully",
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.prismaErrorHandler(error, "DELETE", id);
      this.logger.error(`DELETE: Category/remove: Error: ${error.message}`);
      throw new InternalServerErrorException("Server error occurred");
    }
  }


  private prismaErrorHandler(error: any, method: string, identifier: string) {
    if (error.code === "P2002") {
      this.logger.error(
        `${method}: Conflict: Duplicate entry for interviewId ${identifier}`
      );
      throw new InternalServerErrorException(
        "Duplicate entry: A record with this interview ID already exists."
      );
    }
    this.logger.error(`${method}: Prisma error: ${error.message}`);
  }

  async updateAssignedCategory(assignmentId: string, dto: UpdateCategoryAssignmentDto) {
    this.logger.log(`PATCH: category-assignment/update: Updating assignment ${assignmentId}`);

    try {
      const assignment = await this.prisma.categoryAssignment.findUnique({
        where: { assignmentId },
      });
      if (!assignment) {
        throw new NotFoundException(`Category assignment with ID ${assignmentId} not found`);
      }
      if(await this.checkInterviewIsActive(assignment.interviewId)){
        console.log(await this.checkInterviewIsActive(assignment.interviewId))
        return {
          message: "This interview is Active Interview Cannot Update",
        }
      }
      const updatedAssignment = await this.prisma.categoryAssignment.update({
        where: { assignmentId },
        data: {
          percentage: dto.percentage,
        },
      });

      this.logger.log(`PATCH: category-assignment/update: Assignment ${assignmentId} updated successfully`);
      return {
        message: 'Category assignment updated successfully',
        assignment: updatedAssignment,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`PATCH: category-assignment/update: Error: ${error.message}`);
      throw new InternalServerErrorException('Server error occurred');
    }

  }

  private async checkInterviewIsActive(interviewId: string) {
    const interview = await this.prisma.interview.findUnique({
      where:{interviewID:interviewId}
    })
    return interview.status === 'ACTIVE';
  }

  async removeAssignedCategories(assignmentId: string) {
    this.logger.log(`DELETE: category-assignment/delete: Deleting assignment ${assignmentId}`);

    try {
      // Check if the assignment exists
      const assignment = await this.prisma.categoryAssignment.findUnique({
        where: { assignmentId },
      });
      if (!assignment) {
        throw new NotFoundException(`Category assignment with ID ${assignmentId} not found`);
      }
      if(await this.checkInterviewIsActive(assignment.interviewId)){
        return {
          message: 'This interview is Active Interview Cannot Update',
        }
      }

      await this.prisma.categoryAssignment.delete({
        where: { assignmentId },
      });

      this.logger.log(`DELETE: category-assignment/delete: Assignment ${assignmentId} deleted successfully`);
      return {
        message: 'Category assignment deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`DELETE: category-assignment/delete: Error: ${error.message}`);
      throw new InternalServerErrorException('Server error occurred');
    }
  }

  async createCategoryAssignmnet(dto: CreateCategoryAssignmentDto) {
    this.logger.log(`POST: category-assignment/create: Creating a new category assignment`);

    try {
      // Check if the interview exists
      const interview = await this.prisma.interview.findUnique({
        where: { interviewID: dto.interviewId },
      });
      if (!interview) {
        throw new NotFoundException(`Interview with ID ${dto.interviewId} not found`);
      }

      // Check if the category exists
      const category = await this.prisma.category.findUnique({
        where: { categoryId: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
      }

      const existingAssignment = await this.prisma.categoryAssignment.findUnique({
        where: {
          interviewId_categoryId: {
            interviewId: dto.interviewId,
            categoryId: dto.categoryId,
          },
        },
      });
      if (existingAssignment) {
        throw new BadRequestException('A category assignment for this interview and category already exists');
      }

      // Create the assignment
      const assignment = await this.prisma.categoryAssignment.create({
        data: {
          interviewId: dto.interviewId,
          categoryId: dto.categoryId,
          percentage: dto.percentage,
        },
      });

      this.logger.log(`POST: category-assignment/create: Assignment ${assignment.assignmentId} created successfully`);
      return {
        message: 'Category assignment created successfully',
        assignment,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`POST: category-assignment/create: Error: ${error.message}`);
      throw new InternalServerErrorException('Server error occurred');
    }
  }

  async getAllCategories(companyId: string) {
    this.logger.log(`GET: Category/findAll: Fetching categories for company ID ${companyId}`);

    try {

      const categories = await this.prisma.category.findMany({
        where: { companyId: companyId },
        select: {
          categoryId: true,
          companyId: true,
          categoryName: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!categories || categories.length === 0) {
        this.logger.warn(`GET: No categories found for company ID: ${companyId}`);
        throw new NotFoundException(`No categories found for company ID: ${companyId}`);
      }

      const total = await this.prisma.category.count({
        where: { companyId: companyId },
      });

      this.logger.log(`GET: Category/findAll: Fetched ${categories.length} categories for company ID ${companyId}`);

      return {
        categories,
        total,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`GET: Category/findAll: Error: ${error.message}`);
      throw new InternalServerErrorException("Server error occurred");
    }
  }

  async getCategoryScoresBySessionId(sessionId: string) {
    this.logger.log(`GET: Fetching category scores for session ID: ${sessionId}`);

    try {
      const categoryScores = await this.prisma.categoryScore.findMany({
        where: { sessionId: sessionId },
        include: {
          categoryAssignment: {
            include: {
              category: true,
              SubCategoryAssignment: true,
            },
          },
          subCategoryScores: {
            include: {
              subCategoryAssignment: true,
            }
          }
        },
      });

      if (!categoryScores || categoryScores.length === 0) {
        this.logger.warn(`No category scores found for session ID: ${sessionId}`);
        throw new NotFoundException(`No category scores found for session ID: ${sessionId}`);
      }

      return {
        message: 'Category scores fetched successfully',
        categoryScores,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`GET: Error fetching category scores: ${error.message}`);
      throw new InternalServerErrorException('Server error occurred');
    }
  }

  async updateCategoryScore(categoryScoreId: string, dto: UpdateCategoryScoreDto) {
    this.logger.log(`PATCH: Updating category score with ID: ${categoryScoreId}`);

    try {
      const categoryScore = await this.prisma.categoryScore.findUnique({
        where: { categoryScoreId: categoryScoreId },
      });

      if (!categoryScore) {
        this.logger.warn(`Category score with ID ${categoryScoreId} not found`);
        throw new NotFoundException(`Category score with ID ${categoryScoreId} not found`);
      }

      const updatedCategoryScore = await this.prisma.categoryScore.update({
        where: { categoryScoreId: categoryScoreId },
        data: {
          score: dto.score,
          note: dto.note,
        },
      });

      return {
        message: 'Category score updated successfully',
        categoryScore: updatedCategoryScore,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`PATCH: Error updating category score: ${error.message}`);
      throw new InternalServerErrorException('Server error occurred');
    }
  }

  async updateSubCategoryScore(subCategoryScoreId: string, dto: UpdateCategoryScoreDto) {
    this.logger.log(`PATCH: Updating sub category score with ID: ${subCategoryScoreId}`);

    try {
      const subCategoryScore = await this.prisma.subCategoryScore.findUnique({
        where: { id: subCategoryScoreId },
      });

      if (!subCategoryScore) {
        this.logger.warn(`Sub category score with ID ${subCategoryScoreId} not found`);
        throw new NotFoundException(`Sub category score with ID ${subCategoryScoreId} not found`);
      }

      const updatedSubCategoryScore = await this.prisma.subCategoryScore.update({
        where: { id: subCategoryScoreId },
        data: {
          score: dto.score,
        }
      });

      return {
        message: 'Sub category score updated successfully',
        subCategoryScore: updatedSubCategoryScore,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`PATCH: Error updating category score: ${error.message}`);
      throw new InternalServerErrorException('Server error occurred');
    }
  }

  async calculateTotalScore(sessionId: string) {
    this.logger.log(`GET: Calculating total score for session ID: ${sessionId}`);

    try {
      const categoryScores = await this.prisma.categoryScore.findMany({
        where: { sessionId: sessionId },
        include: {
          categoryAssignment: {
            select: { percentage: true }
          },
          subCategoryScores: {
            include: {
              subCategoryAssignment: {
                select: { percentage: true }
              }
            }
          }
        }
      });

      if (!categoryScores || categoryScores.length === 0) {
        this.logger.warn(`No category scores found for session ID: ${sessionId}`);
        throw new NotFoundException(`No category scores found for session ID: ${sessionId}`);
      }

      let totalScore = 0;

      // Update category scores and calculate total score
      for (const categoryScore of categoryScores) {
        const categoryPercentage = categoryScore.categoryAssignment.percentage;
        let effectiveCategoryScore = categoryScore.score;

        // If subcategories exist, calculate the parent category score
        if (categoryScore.subCategoryScores.length > 0) {
          effectiveCategoryScore = categoryScore.subCategoryScores.reduce((sum, subScore) => {
            const subWeight = subScore.subCategoryAssignment.percentage / 100;
            return sum + (subScore.score * subWeight);
          }, 0);

          // Update the parent category score in the database
          await this.prisma.categoryScore.update({
            where: { categoryScoreId: categoryScore.categoryScoreId },
            data: { score: effectiveCategoryScore }
          });
        }

        // Apply category weight to total score
        totalScore += effectiveCategoryScore * (categoryPercentage / 100);
      }

      // Update the session with the total score
      const session = await this.prisma.interviewSession.update({
        where: { sessionId: sessionId },
        data: { score: this.roundToTwoDecimals(totalScore) }
      });

      return {
        message: 'Total score calculated successfully',
        totalScore: this.roundToTwoDecimals(totalScore),
        session
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`GET: Error calculating total score: ${error.message}`);
      throw new InternalServerErrorException('Server error occurred');
    }
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  async getAssignedCategories(sessionId: string) {
    this.logger.log(`GET: Fetching category Assignment for session ID: ${sessionId}`);

    try {
      const session = await this.prisma.interviewSession.findUnique({
        where: {
          sessionId: sessionId,
        }
      })

      if(!session) {
        this.logger.warn(`No session found for session ID: ${sessionId}`);
        throw new NotFoundException(`No session found for session ID: ${sessionId}`);
      }
      const categoryScores = await this.prisma.categoryScore.findMany({
        where: { sessionId: sessionId },
        include: {
            categoryAssignment: {
              include: {
                category: true,
              }
            }
        },
      });

      if (!categoryScores || categoryScores.length === 0) {
        this.logger.warn(`No category Assignments found for session ID: ${sessionId}`);
        throw new NotFoundException(`No category Assignments found for session ID: ${sessionId}`);
      }

      const categoryAssignments = categoryScores.map((categoryScore) => {
        return categoryScore.categoryAssignment;
      })

      return {
        message: 'Category assignments fetched successfully',
        categoryAssignments,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`GET: Error fetching category scores: ${error.message}`);
      throw new InternalServerErrorException('Server error occurred');
    }
  }
}
