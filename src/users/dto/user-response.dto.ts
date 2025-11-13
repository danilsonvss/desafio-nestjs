import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'User role',
    enum: ['PRODUCER', 'AFFILIATE', 'COPRODUCER', 'PLATFORM'],
    example: 'PRODUCER',
  })
  role: string;

  @ApiProperty({
    description: 'User creation date',
    example: '2025-11-13T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'User balance',
    example: 1500.50,
    required: false,
  })
  balance?: number;
}
