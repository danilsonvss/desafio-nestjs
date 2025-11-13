import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';

export enum Role {
  PRODUCER = 'PRODUCER',
  AFFILIATE = 'AFFILIATE',
  COPRODUCER = 'COPRODUCER',
  PLATFORM = 'PLATFORM',
}

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'strongPassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'User role',
    enum: Role,
    example: Role.PRODUCER,
  })
  @IsEnum(Role)
  role: Role;
}
