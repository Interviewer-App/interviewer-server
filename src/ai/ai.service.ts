import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OpenAI } from 'openai';
import { GenerateQuestionsDto } from './dto/generate-questions.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalyzeQuestionDto } from './dto/analyze-question.dto';
import { AnalyzeCandidateDto } from './dto/analyze-candidate.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger('AIService');

  private openai: OpenAI;
  private genAI: GoogleGenerativeAI;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async generateQuestions(
    id: string,
    dto: GenerateQuestionsDto,
  ): Promise<{ message: string; interview: any }> {
    this.logger.log(`POST: interview/generate-and-add-questions: Started`);
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
    });
    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    };

    try {
      const existingInterview = await this.prisma.interview.findUnique({
        where: { id: id },
      });

      if (!existingInterview) {
        this.logger.warn(`Interview with ID ${id} not found`);
        throw new NotFoundException(`Interview with ID ${id} not found`);
      }
      const prompt = `Generate 5 interview questions for a ${dto.skillLevel} ${dto.jobRole} role. Provide the question, specify the type: 'open-ended' or 'coding' and estimate time for the answering each question. Format the response as JSON.`;

      //   const response = await this.openai.chat.completions.create({
      //     model: "gpt-3.5-turbo",
      //     messages: [{ role: "user", content: prompt }],
      //     response_format: { type: "json_object" },
      //   });

      //   const content = response.choices[0]?.message?.content;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: generationConfig,
      });
      const content = result.response.text();
      let questions: { question: string; type: string }[] = [];

      try {
        questions = JSON.parse(content);
      } catch (parseError) {
        this.logger.error(
          'Failed to parse OpenAI response into JSON format',
          parseError,
        );
        throw new InternalServerErrorException('Invalid response from OpenAI');
      }

      if (
        !Array.isArray(questions) ||
        !questions.every((q) => q.question && q.type)
      ) {
        throw new InternalServerErrorException(
          'Generated questions do not match the expected format',
        );
      }

      await Promise.all(
        questions.map(async (q) => {
          return this.prisma.question.create({
            data: {
              interviewId: id,
              question: q.question,
              type:
                q.type.toUpperCase() === 'OPEN-ENDED' ? 'OPEN_ENDED' : 'CODING',
            },
          });
        }),
      );

      const interview = await this.prisma.interview.update({
        where: { id: id },
        data: {
          questions: questions,
        },
      });

      this.logger.log(
        `POST: interview/generate-and-add-questions: Interview ${interview.id} updated successfully`,
      );

      return {
        message: 'Questions generated and added successfully',
        interview,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `POST: interview/generate-and-add-questions: Error occurred: ${error.message}`,
      );
      this.prismaErrorHandler(error, 'POST', id);
      throw new InternalServerErrorException('Server error occurred');
    }
  }

  async analyzeResponse(dto: AnalyzeQuestionDto): Promise<any> {
    this.logger.log(`POST: interview/generate-and-add-questions: Started`);
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
    });
    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    };

    try {
      const prompt = `
                    Analyze the following interview response and provide:
                    1. Relevance score (0-100)
                    2. Key strengths
                    3. Areas of improvement
                    4. Alignment with job requirements
                    5. Another related  3 questions based on answer

                    Question: "${dto.question}"
                    Candidate's Response: "${dto.answer}"
                    
                    Provide the result as a JSON object in the following format:
                    {
                    "relevanceScore": number,
                    "keyStrengths": string[],
                    "areasOfImprovement": string[],
                    "alignment": string,
                    "followUpQuestions":string[]
                    }
                `;

      //   const response = await this.openai.chat.completions.create({
      //     model: "gpt-3.5-turbo",
      //     messages: [{ role: "user", content: prompt }],
      //     response_format: { type: "json_object" },
      //   });

      //   const content = response.choices[0]?.message?.content;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: generationConfig,
      });
      const content = result.response.text();
      let analiyze = [];

      try {
        analiyze = JSON.parse(content);
      } catch (parseError) {
        this.logger.error(
          'Failed to parse OpenAI response into JSON format',
          parseError,
        );
        throw new InternalServerErrorException('Invalid response from OpenAI');
      }

      return analiyze;
    } catch (error) {
      this.logger.error(
        `POST: interview/generate-and-add-questions: Error occurred: ${error.message}`,
      );
      // this.prismaErrorHandler(error, "POST", id);
      throw new InternalServerErrorException('Server error occurred');
    }
  }

  async analyzeCandidate(dto: AnalyzeCandidateDto): Promise<any> {
    this.logger.log(`POST: ai/analyze candidate: Started`);
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
    });
    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    };

    try {
      // const prompt = `
      //     Analyze the candidate details provided below and generate a comprehensive analysis. Specifically, provide:
      //     1. A detailed summary of the candidate's profile, including skills, education level, experience, and suitability for the specified position.
      //     2. A relevance score (0-100) based on the candidate's alignment with the requirements of the position.
      //     3. Key strengths that highlight the candidate's potential for the position.
      //     Candidate Details:
      //     {
      //       "name": "${dto.name}",
      //       "skills": ${JSON.stringify(dto.skills)},
      //       "country": "${dto.country}",
      //       "position": "${dto.position }",
      //       "yearsOfExp": ${dto.yearsOfExperience},
      //       "educationLevel": "${dto.educationLevel}"
      //     }
      //
      //     Format your response as a JSON object with the following structure:
      //     {
      //       "summary": string, // A detailed summary of the candidate's profile
      //       "relevanceScore": number, // Relevance score between 0 and 100
      //       "keyStrengths": string[], // A list of the candidate's strengths
      //     }
      //     `;

      const prompt = `
                Analyze the candidate details provided below and generate a comprehensive analysis. Specifically, provide:
                1. A detailed summary of the candidate's profile that includes:
                   - Their name and professional identity.
                   - Skills with examples of how these may apply to the specified position.
                   - Education level and how it supports their professional background.
                   - Years of experience and notable achievements or expertise in their field.
                   - Any additional insights based on their country and industry trends.
                2. A relevance score (0-100) based on the alignment between the candidate's profile and the requirements of the specified position.
                3. Key strengths that highlight the candidate's potential for excelling in the specified role.
                
                Candidate Details:
                {
                  "name": "${dto.name || 'Not specified'}",
                  "skills": ${JSON.stringify(dto.skills)},
                  "country": "${dto.country || 'Not specified'}",
                  "position": "${dto.position || 'Not specified'}",
                  "yearsOfExp": ${dto.yearsOfExperience || 'Not specified'},
                  "educationLevel": "${dto.educationLevel || 'Not specified'}"
                }
                
                Consider the following when generating your analysis:
                - Tailor the summary to the specified position.
                - Highlight connections between the candidate’s skills and the role's likely requirements.
                - If applicable, mention the candidate's suitability for remote, hybrid, or in-person roles based on their location.
                - Suggest potential areas where the candidate might excel based on their profile.
                
                Format your response as a JSON object with the following structure:
                {
                  "summary": string, // A highly detailed and tailored summary of the candidate's profile
                  "relevanceScore": number, // Relevance score between 0 and 100
                  "keyStrengths": string[] // A list of the candidate's unique strengths
                }
            `;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: generationConfig,
      });
      const content = result.response.text();
      let analiyze = [];

      try {
        analiyze = JSON.parse(content);
      } catch (parseError) {
        this.logger.error(
          'Failed to parse OpenAI response into JSON format',
          parseError,
        );
        throw new InternalServerErrorException('Invalid response from OpenAI');
      }

      return analiyze;
    } catch (error) {
      this.logger.error(
        `POST: interview/generate-and-add-questions: Error occurred: ${error.message}`,
      );
      throw new InternalServerErrorException('Server error occurred');
    }
  }

  private prismaErrorHandler(error: any, method: string, identifier: string) {
    if (error.code === 'P2002') {
      this.logger.error(
        `${method}: Conflict: Duplicate entry for companyId ${identifier}`,
      );
      throw new InternalServerErrorException(
        'Duplicate entry: A record with this company ID already exists.',
      );
    }
    this.logger.error(`${method}: Prisma error: ${error.message}`);
  }
}
