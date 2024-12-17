import { BadRequestException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { OpenAI } from 'openai';
import { GenerateQuestionsDto } from './dto/generate-questions.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
            const prompt = `Generate 5 interview questions for a ${dto.skillLevel} ${dto.jobRole} role. Provide the question and specify the type: 'open-ended' or 'coding'. Format the response as JSON.`;

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
