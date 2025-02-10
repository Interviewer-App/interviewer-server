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
import { ComparisonBodyDto } from "./dto/comparison-body.dto";
import { AnalyzeCvDto } from "./dto/analyze-cv.dto";
import { GenerateDescriptionDto } from "./dto/generate-description.dto";
import axios from 'axios';
import * as pdfParse from 'pdf-parse';
import { GenerateSchedulesDto } from "./dto/generate-schedules.dto";
import * as puppeteer from 'puppeteer';
import { CategoryService } from '../category/category.service';

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


  async generateQuestions(id: string, dto: GenerateQuestionsDto): Promise<any> {
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
      // Check if the interview session exists
      const existingInterview = await this.prisma.interviewSession.findUnique({
        where: { sessionId: id },
      });

      if (!existingInterview) {
        this.logger.warn(`Interview with ID ${id} not found`);
        throw new NotFoundException(`Interview with ID ${id} not found`);
      }

      // The company culture is: ${dto.companyCulture || 'not specified'}.
      // The company's aim is: ${dto.companyAim || 'not specified'}.

      // Construct the prompt using DTO fields
      const prompt = `
          Generate ${dto.noOfQuestions} interview questions for a ${dto.skillLevel} ${dto.jobRole} role.
          The type of questions to generate is: ${dto.QuestionType}.
          Keywords to focus on: ${dto.Keywords?.join(', ') || 'not specified'}.
        
          For each question, provide:
          1. The question text.
          2. The type of question: 'open-ended' or 'coding'.
          3. The estimated time for answering the question (in minutes).
          4. An explanation of what the question is designed to assess and why it is relevant to the role.
        
          Format the response as a JSON array, where each question is an object with the following fields:
          - question: The question text.
          - type: The type of question ('open-ended' or 'coding').
          - estimated_time: The estimated time for answering the question (e.g., "5 minutes").
          - explanation: A brief explanation of what the question assesses and its relevance to the role.
        `;

      // Generate questions using the AI model
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: generationConfig,
      });

      const content = result.response.text();

      // Parse the generated content into JSON
      let questions: {
        question: string;
        type: string;
        estimated_time: string;
        explanation: string;
      }[] = [];

      try {
        questions = JSON.parse(content);
      } catch (parseError) {
        this.logger.error(
          'Failed to parse AI response into JSON format',
          parseError,
        );
        throw new InternalServerErrorException('Invalid response from AI');
      }

      // Validate the structure of the generated questions
      if (
        !Array.isArray(questions) ||
        !questions.every((q) => q.question && q.type && q.estimated_time)
      ) {
        throw new InternalServerErrorException(
          'Generated questions do not match the expected format',
        );
      }

      // Save the generated questions to the database
      await Promise.all(
        questions.map(async (q) => {
          return this.prisma.question.create({
            data: {
              questionText: q.question,
              type:
                q.type.toUpperCase() === 'OPEN-ENDED' ? 'OPEN_ENDED' : 'CODING',
              explanation: q.explanation,
              estimatedTimeMinutes: parseInt(
                q.estimated_time.match(/\d+/)?.[0] || '0',
                10,
              ),
              aiContext: `Generated for ${dto.jobRole} (${dto.skillLevel})`,
              usageFrequency: 0,
              interviewSession: {
                connect: {
                  sessionId: id,
                },
              },
            },
          });
        }),
      );

      this.logger.log(
        `POST: interview/generate-and-add-questions: Questions generated and saved successfully`,
      );
      return {
        message: 'Questions generated and saved successfully',
        questions,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(
        `POST: interview/generate-and-add-questions: Error: ${error.message}`,
      );
      throw new InternalServerErrorException('Server error occurred');
    }
  }

  async generateQuestionsForInterview(id: string, dto: GenerateQuestionsDto): Promise<any> {
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
        where: { interviewID: id },
      });

      if (!existingInterview) {
        this.logger.warn(`Interview with ID ${id} not found`);
        throw new NotFoundException(`Interview with ID ${id} not found`);
      }

      const company = await this.prisma.company.findUnique({
        where: { companyID: existingInterview.companyID },
      })

      // Construct the prompt using DTO fields
      const prompt = `
          Generate ${dto.noOfQuestions} interview questions for a ${dto.skillLevel} ${dto.jobRole} role.
          The company culture and aim is: ${company.companyDescription || 'not specified'}.
          The type of questions to generate is: ${dto.QuestionType}.
          Keywords to focus on: ${dto.Keywords?.join(', ') || 'not specified'}.
        
          For each question, provide:
          1. The question text.
          2. The type of question: 'open-ended' or 'coding'.
          3. The estimated time for answering the question (in minutes).
          4. An explanation of what the question is designed to assess and why it is relevant to the role.
        
          Format the response as a JSON array, where each question is an object with the following fields:
          - question: The question text.
          - type: The type of question ('open-ended' or 'coding').
          - estimated_time: The estimated time for answering the question (e.g., "5 minutes").
          - explanation: A brief explanation of what the question assesses and its relevance to the role.
        `;

      // Generate questions using the AI model
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: generationConfig,
      });

      const content = result.response.text();

      // Parse the generated content into JSON
      let questions: {
        question: string;
        type: string;
        estimated_time: string;
        explanation: string;
      }[] = [];

      try {
        questions = JSON.parse(content);
      } catch (parseError) {
        this.logger.error(
          'Failed to parse AI response into JSON format',
          parseError,
        );
        throw new InternalServerErrorException('Invalid response from AI');
      }

      // Validate the structure of the generated questions
      if (
        !Array.isArray(questions) ||
        !questions.every((q) => q.question && q.type && q.estimated_time)
      ) {
        throw new InternalServerErrorException(
          'Generated questions do not match the expected format',
        );
      }

      // Save the generated questions to the database
      await Promise.all(
        questions.map(async (q) => {
          return this.prisma.interviewQuestions.create({
            data: {
              questionText: q.question,
              type:
                q.type.toUpperCase() === 'OPEN-ENDED' ? 'OPEN_ENDED' : 'CODING',
              explanation: q.explanation,
              estimatedTimeMinutes: parseInt(
                q.estimated_time.match(/\d+/)?.[0] || '0',
                10,
              ),
              aiContext: `Generated for ${dto.jobRole} (${dto.skillLevel})`,
              usageFrequency: 0,
              interviews: {
                connect: {
                  interviewID: id,
                },
              },
            },
          });
        }),
      );

      this.logger.log(
        `POST: interview/generate-and-add-questions: Questions generated and saved successfully`,
      );
      return {
        message: 'Questions generated and saved successfully',
        questions,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(
        `POST: interview/generate-and-add-questions: Error: ${error.message}`,
      );
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

  async compareSessions(comparisonBodyDto: ComparisonBodyDto) {
    try {
      const sessionId1 = comparisonBodyDto.sessionId1;
      const sessionId2 = comparisonBodyDto.sessionId2;

      const [session1, session2] = await Promise.all([
        this.getSessionWithDetails(sessionId1),
        this.getSessionWithDetails(sessionId2),
      ]);

      if (!session1 || !session2) {
        throw new NotFoundException('One or both sessions not found');
      }

      const comparisonData = {
        session1: this.formatSessionData(session1),
        session2: this.formatSessionData(session2),
      };

      const analysis = await this.generateComparisonAnalysis(comparisonData);


      return {
        // comparison: analysis,
        // rawData: comparisonData
        ...analysis,
      };
    } catch (error) {
      this.logger.error(`Error comparing sessions: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async getSessionWithDetails(sessionId: string) {
    return this.prisma.interviewSession.findUnique({
      where: { sessionId },
      include: {
        candidate: {
          include: {
            user: true
          }
        },
        interview: true,
        questions: {
          include: {
            interviewResponses: {
              include: {
                score: true
              }
            }
          }
        },
        CategoryScore: {
          include: {
            categoryAssignment: {
              include: {
                category: true
              }
            }
          }
        },
        scheduling: true
      }
    });
  }

  private formatSessionData(session: any) {
    return {
      candidate: {
        name: `${session.candidate.user.firstName} ${session.candidate.user.lastName}`,
        // experience: session.candidate.profile.experience,
        // skills: session.candidate.profile.skills,
        // education: session.candidate.profile.education,
      },
      interview: {
        totalScore: session.score,
        timeConsumed: session.timeConsumed,
        categories: session.CategoryScore.map(cs => ({
          name: cs.categoryAssignment.category.categoryName,
          score: cs.score,
          note: cs.note
        })),
        responses: session.questions.map(q => ({
          question: q.questionText,
          answer: q.interviewResponses?.responseText,
          score: q.interviewResponses?.score?.score,
          time: q.interviewResponses?.responseTime
        }))
      }
    };
  }

  private async generateComparisonAnalysis(data: any) {
    const prompt = `
      Analyze these two interview candidates and provide a detailed comparison. 
      Consider the following factors:
      - Technical skills (based on coding questions and scores)
      - Problem-solving approach (based on response times and answer quality)
      - Communication skills (based on open-ended question responses)
      - Category-wise performance
      - Overall interview performance
      - Experience and education background

      Candidate 1 Data:
      ${JSON.stringify(data.session1, null, 2)}

      Candidate 2 Data:
      ${JSON.stringify(data.session2, null, 2)}
      
      Provide response in this JSON format:
      Return JSON output with the following structure, This response should be a single JSON object. Do not include any additional text or formatting.
      {
        "overall": {
          "score": {c1: num, c2: num, diff: num},
          "time": {c1: num, c2: num, diff: str}
        },
        "categories": [{
          "name": str,
          "score": {c1: num, c2: num, diff: str}
          "metrics": [{
            "metric": str,
            "c1": str|num, 
            "c2": str|num,
            "note": str,
            "importance": str
          }]
        }],
        "strengths": {
          "c1": {strengths: str[], weaknesses: str[]},
          "c2": {strengths: str[], weaknesses: str[]}
        },
        "experience": {
          "projects": {c1: str, c2: str, comparison: str},
          "education": {c1: str, c2: str, relevance: str}
        },
        "recommendation": {
          "best": "c1"|"c2",
          "reason": str,
          "factors": str[],
          "confidence": "high"|"med"|"low"  
        },
        "summary": {
          "technical": str,
          "culture": str,
          "growth": str
        }
      }
        This response should be a single JSON object. Do not include any additional text or formatting.
    `;

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response.text();


      let analysis;
      try {
        analysis = this.extractJsonFromMarkdown(response);
      } catch (e) {
        this.logger.error('Failed to parse Gemini response', e);
        throw new Error('Failed to parse analysis response');
      }

      return analysis;
    } catch (error) {
      this.logger.error('Gemini API error:', error);
      throw new Error('Failed to generate comparison analysis');
    }
  }

  private extractJsonFromMarkdown(response: string): any {

    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = response.match(jsonBlockRegex);

    if (match && match[1]) {
      const jsonResponse = match[1].trim();
      return JSON.parse(jsonResponse);
    }

    try {
      return JSON.parse(response);
    } catch (e) {
      throw new Error('Invalid response format: No JSON block found');
    }
  }

  async analyzeCV(dto: AnalyzeCvDto) {
    try {

      const candidate = await this.prisma.candidate.findUnique({
        where: {
          profileID: dto.candidateId
        }
      })
      if(!candidate) {
        this.logger.warn(`No candidate found for this given Candidate ID ${dto.candidateId}`);
        throw new NotFoundException(`No candidate found for this given Candidate ID ${dto.candidateId}`)
      }
      const response = await axios.get(dto.Url, { responseType: 'arraybuffer' });

      const pdfData = await pdfParse(response.data);
      const extractedText = pdfData.text;

      if (!extractedText || extractedText.length < 50) {
        throw new Error("PDF extraction failed or content is too short.");
      }

      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
      });

      const prompt = `
      Analyze the following CV and return only valid JSON. Do not include explanations, code blocks, or extra text.

      CV Content:
      ${extractedText}

      JSON Output Format:
      {
          "summary": "Brief overview of the candidate",
          "skills": ["Skill 1", "Skill 2"],
          "experience": ["Job 1", "Job 2"],
          "education": ["Degree 1", "Degree 2"],
          "contact_info": {
              "email": "example@example.com",
              "phone": "123456789"
          }
      }
          This response should be a single JSON object. Do not include any additional text or formatting.
      `;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const content = result.response.text();
      console.log("Raw AI Response:", content); // Debugging

      const cleanedContent = content.replace(/```json|```/g, '').trim();
      const analysisResult = JSON.parse(cleanedContent);

      const candidateAnalysis = await this.prisma.candidateAnalysis.upsert({
        where: { candidateID: dto.candidateId },
        update: {
          summary: analysisResult.summary,
          skills: analysisResult.skills,
          experience: analysisResult.experience,
          education: analysisResult.education,
          contactInfo: analysisResult.contact_info,
        },
        create: {
          candidateID: dto.candidateId,
          summary: analysisResult.summary,
          skills: analysisResult.skills,
          experience: analysisResult.experience,
          education: analysisResult.education,
          contactInfo: analysisResult.contact_info,
        },
      });

      return candidateAnalysis;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error("Error analyzing CV:", error);
      throw new InternalServerErrorException("Failed to analyze CV");
    }
  }


  async generateDescription(dto: GenerateDescriptionDto): Promise<any> {
    this.logger.log(`POST: interview/generate-description: Started`);
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
    });
    const generationConfig = {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    };

    const usersDescription = dto.description;
    try {
      const prompt = `
        Analyze the following job position description and generate a comprehensive, professional job description 
        formatted in HTML with JSON encoding. The description should be visually appealing and include:

        Required sections:
        1. <h2>Position Overview</h2> - Brief introduction about the role
        2. <h2>Key Responsibilities</h2> - Bullet points of core duties
        3. <h2>Technical Requirements</h2> - Bullet points of technical skills/technologies
        4. <h2>Qualifications</h2> - Bullet points of education/experience
        5. <h2>Preferred Skills</h2> - Bullet points of nice-to-have qualifications

        Formatting rules:
        - Use <h2> for section headings
        - Use <ul> and <li> for bullet points
        - Use <b> for important terms/technologies
        - Maintain professional tone
        - Avoid markdown, use only specified HTML tags
        - Ensure proper HTML nesting and formatting

        Input description: "${usersDescription}"

        Respond ONLY with valid JSON containing the HTML in a 'description' field. 

        Example response format:

        {
          "description": "<h2>Position Overview</h2><p>We are seeking...</p><h2>Key Responsibilities</h2><ul><li><b>Develop</b> web applications using...</li></ul>"
        }

        Not an array. This response should be a single JSON object.Do not include any additional text or formatting.
      `;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: generationConfig,
      });

      const content = result.response.text();
      this.logger.debug('Generated content:', content);
      this.logger.log('Generated content:', content);

      try {
        const parsedResponse = JSON.parse(content);
        if (!parsedResponse.description || typeof parsedResponse.description !== 'string') {
          throw new Error('Invalid response structure');
        }
        return parsedResponse;
      } catch (parseError) {
        this.logger.error(
          'Failed to parse response into JSON format',
          parseError.message,
          { content }
        );
        throw new InternalServerErrorException('Invalid response format from AI service');
      }
    } catch (error) {
      this.logger.error(
        `POST: interview/generate-description: Error occurred: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException('Failed to generate job description');
    }
  }

  async generateSchedules(dto: GenerateSchedulesDto): Promise<any> {
    this.logger.log(`POST: interview/generate-schedules: Started`);
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
    });

    const generationConfig = {
      temperature: 0.3,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    };

    try {
      const prompt = `
      Generate interview time slots based on these parameters:
      - Date range: ${dto.startDate} to ${dto.endDate}
      - Daily working hours: ${dto.dailyStartTime} to ${dto.dailyEndTime}
      - Slot duration: ${dto.duration} minutes
      - One interval for meal for each day: ${dto.intervalMinutes || 'ten'} minutes
      - Non-working dates: ${dto.nonWorkingDates?.join(', ') || 'none'}

      Rules:
      1. Skip dates listed in non-working dates
      2. Create slots within working hours for each day
      3. Maintain specified interval for each day
      4. Each slot should be exactly ${dto.duration} minutes long
      5. Output in UTC timezone format

      Return ONLY JSON format matching this structure:
      {
        "schedules": [
          {
            key: number++ ,
            date: ,
            startTime: hh:mm ,
            endTime: hh:mm,
          }
        ]
      }
    `;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: generationConfig,
      });

      const content = result.response.text();
      // this.logger.debug('Generated content:', content);

      try {
        const parsedResponse = JSON.parse(content);
        if (!Array.isArray(parsedResponse.schedules)) {
          throw new Error('Invalid response structure');
        }
        return parsedResponse;
      } catch (parseError) {
        this.logger.error(
          'Failed to parse response into JSON format',
          parseError.message,
          { content }
        );
        throw new InternalServerErrorException('Invalid response format from AI service');
      }
    } catch (error) {
      this.logger.error(
        `POST: interview/generate-schedules: Error occurred: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException('Failed to generate schedules');
    }
  }

  async generatePdf(url: string): Promise<Buffer> {
    let browser = null;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--font-render-hinting=none',
        ],
      });

      const page = await browser.newPage();

      await page.goto(url, {
        waitUntil: ['networkidle0'],
      });

      await page.evaluateHandle('document.fonts.ready');

      const pdf = await page.pdf({
        format: 'A4',
        scale: 0.67,
        margin: {
          top: '10mm',
          left: '10mm',
          right: '10mm',
          bottom: '10mm',
        },
      });

      return pdf;
    } catch (error) {
      throw new Error(`PDF generation failed: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
