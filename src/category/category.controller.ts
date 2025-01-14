import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpCode,
  HttpStatus, Patch
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Auth } from '../auth/decorators';
import { Role } from '@prisma/client';
import { UpdateCategoryAssignmentDto } from "./dto/update-category-assignment.dto";
import { CreateCategoryAssignmentDto } from "./dto/create-category-assignment.dto";

@ApiBearerAuth()
@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({
    summary: 'CREATE CATEGORY',
    description: 'Private endpoint to create a new category. It is allowed only by "company" users.',
  })
  @ApiResponse({ status: 201, description: 'Category created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 500, description: 'Server error.' })
  @Auth(Role.COMPANY)
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return await this.categoryService.create(createCategoryDto);
  }

  @Get(':companyId/:page/:limit')
  @ApiOperation({
    summary: 'GET ALL CATEGORIES',
    description: 'Public endpoint to fetch all categories.',
  })
  @ApiResponse({ status: 200, description: 'Categories fetched successfully.' })
  @ApiResponse({ status: 500, description: 'Server error.' })
  @Auth(Role.COMPANY)
  async findAll(@Param('companyId') companyId: string, @Param('page') page: number, @Param('limit') limit: number) {
    return await this.categoryService.findAll(companyId, page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'GET CATEGORY BY ID',
    description: 'Public endpoint to fetch a category by its ID.',
  })
  @ApiParam({ name: 'id', description: 'Category ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Category fetched successfully.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({ status: 500, description: 'Server error.' })
  @Auth(Role.COMPANY)
  async findOne(@Param('id') id: string) {
    return await this.categoryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'UPDATE CATEGORY',
    description: 'Private endpoint to update a category. It is allowed only by "company" users.',
  })
  @ApiParam({ name: 'id', description: 'Category ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Category updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({ status: 500, description: 'Server error.' })
  @Auth(Role.COMPANY)
  async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return await this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'DELETE CATEGORY',
    description: 'Private endpoint to delete a category. It is allowed only by "company" users.',
  })
  @ApiParam({ name: 'id', description: 'Category ID', type: 'string' })
  @ApiResponse({ status: 204, description: 'Category deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({ status: 500, description: 'Server error.' })
  @Auth(Role.COMPANY)
  async remove(@Param('id') id: string) {
    return await this.categoryService.remove(id);
  }

  @Patch('category-assigned/:assignmentId')
  @ApiOperation({
    summary: 'UPDATE CATEGORY Assignment',
    description: 'Private endpoint to update a category assignment with interviews. It is allowed only by "company" users.',
  })
  @ApiParam({ name: 'assignmentId', description: 'Category Assignment ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Category assignment updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({ status: 500, description: 'Server error.' })
  @Auth(Role.COMPANY)
  async updateAssignedCategory(@Param('assignmentId') assignmentId: string, @Body() updateCategoryAssignmentDto: UpdateCategoryAssignmentDto) {
    return await this.categoryService.updateAssignedCategory(assignmentId, updateCategoryAssignmentDto);
  }

  @Delete('category-assigned/:assignmentId')
  @ApiOperation({
    summary: 'DELETE CATEGORY',
    description: 'Private endpoint to delete a category. It is allowed only by "company" users.',
  })
  @ApiParam({ name: 'assignmentId', description: 'Category Assignment ID', type: 'string' })
  @ApiResponse({ status: 204, description: 'Category assignment deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({ status: 500, description: 'Server error.' })
  @Auth(Role.COMPANY)
  async removeAssignedCategories(@Param('assignmentId') assignmentId: string) {
    return await this.categoryService.removeAssignedCategories(assignmentId);
  }

  @Post('category-assigned')
  @ApiOperation({
    summary: 'CREATE CATEGORY ASSIGNMENT',
    description: 'Creates a new category assignment.',
  })
  @ApiBody({ type: CreateCategoryAssignmentDto })
  @ApiResponse({ status: 201, description: 'Category assignment created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request (e.g., duplicate assignment).' })
  @ApiResponse({ status: 404, description: 'Interview or category not found.' })
  @ApiResponse({ status: 500, description: 'Server error.' })
  async createCategoryAssignment(@Body() dto: CreateCategoryAssignmentDto) {
      return await this.categoryService.createCategoryAssignmnet(dto);
  }
}