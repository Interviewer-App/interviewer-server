import { ApiProperty } from "@nestjs/swagger";
import { Role } from "@prisma/client";

export class EmailServer {
    
    @ApiProperty({
        description: "To",
        uniqueItems: true,
        nullable: false,
        required: true,
        type: "string",
        example: "youremail@example.com",
    })
    to: string;
    
      @ApiProperty({
        description: "Company ID",
        nullable: false,
        required: true,
        type: "string",
        example: "cm4quxjjs0003vuuc0arunrlf",
      })
      subject: string;
    
      @ApiProperty({
        description: "Title of the interview",
        nullable: false,
        required: true,
        type: "string",
        example: "Senior Engineer Interview",
      })
      body: string;
    
    
    @ApiProperty({
        description: "Created At",
        nullable: true,
        required: false,
        type: "string",
        example: "2022-01-01T00:00:00.000Z",
    })    
    createdAt?: Date; 
    
    @ApiProperty({
        description: "Updated At",
        nullable: true,
        required: false,
        type: "string",
        example: "2022-01-01T00:00:00.000Z",
    })    
    updatedAt?: Date; 
    
}