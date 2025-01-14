import { Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../prisma/prisma.service';

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
  
}
