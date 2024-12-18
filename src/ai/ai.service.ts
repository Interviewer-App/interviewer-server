import { BadRequestException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { OpenAI } from 'openai';
import { GenerateQuestionsDto } from './dto/generate-questions.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalyzeQuestionDto } from './dto/analyze-question.dto';

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

    async generateQuestions(id: string, dto: GenerateQuestionsDto): Promise<{ message: string; interview: any }> {
        this.logger.log(`POST: interview/generate-and-add-questions: Started`);
        const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const generationConfig = {
            temperature: 1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
        };

        try {
            const prompt = `Generate 5 interview questions for a ${dto.skillLevel} ${dto.jobRole} role. Provide the question, specify the type: 'open-ended' or 'coding' and estimate time for the answering each question. Format the response as JSON.`;

            //   const response = await this.openai.chat.completions.create({
            //     model: "gpt-3.5-turbo",
            //     messages: [{ role: "user", content: prompt }],
            //     response_format: { type: "json_object" },
            //   });

            //   const content = response.choices[0]?.message?.content;

            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: generationConfig,
            });
            const content = result.response.text();
            let questions: { question: string; type: string }[] = [];

            try {
                questions = JSON.parse(content);
            } catch (parseError) {
                this.logger.error(
                    "Failed to parse OpenAI response into JSON format",
                    parseError
                );
                throw new InternalServerErrorException("Invalid response from OpenAI");
            }

            if (!Array.isArray(questions) || !questions.every(q => q.question && q.type)) {
                throw new InternalServerErrorException(
                    "Generated questions do not match the expected format"
                );
            }

            const createdQuestions = await Promise.all(
              questions.map(async (q) => {
                  return await this.prisma.question.create({
                      data: {
                          interviewId: id,
                          question: q.question,
                          type: q.type.toUpperCase() === 'OPEN-ENDED' ? 'OPEN_ENDED' : 'CODING',
                      },
                  });
              })
            );

            const interview = await this.prisma.interview.update({
                where: { id: id },
                data: {
                    questions: questions,
                },
            });

            this.logger.log(
                `POST: interview/generate-and-add-questions: Interview ${interview.id} updated successfully`
            );

            return {
                message: "Questions generated and added successfully",
                interview,
            };
        } catch (error) {
            this.logger.error(
                `POST: interview/generate-and-add-questions: Error occurred: ${error.message}`
            );
            this.prismaErrorHandler(error, "POST", id);
            throw new InternalServerErrorException("Server error occurred");
        }
    }

    async analyzeResponse(dto: AnalyzeQuestionDto): Promise<any> {
        this.logger.log(`POST: interview/generate-and-add-questions: Started`);
        const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const generationConfig = {
            temperature: 1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
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
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: generationConfig,
            });
            const content = result.response.text();
            let analiyze = [];

            try {
                analiyze = JSON.parse(content);
            } catch (parseError) {
                this.logger.error(
                    "Failed to parse OpenAI response into JSON format",
                    parseError
                );
                throw new InternalServerErrorException("Invalid response from OpenAI");
            }

            return analiyze;
        } catch (error) {
            this.logger.error(
                `POST: interview/generate-and-add-questions: Error occurred: ${error.message}`
            );
            // this.prismaErrorHandler(error, "POST", id);
            throw new InternalServerErrorException("Server error occurred");
        }
    }

    private prismaErrorHandler(error: any, method: string, identifier: string) {
        if (error.code === "P2002") {
            this.logger.error(
                `${method}: Conflict: Duplicate entry for companyId ${identifier}`
            );
            throw new InternalServerErrorException(
                "Duplicate entry: A record with this company ID already exists."
            );
        }
        this.logger.error(`${method}: Prisma error: ${error.message}`);
    }
}
