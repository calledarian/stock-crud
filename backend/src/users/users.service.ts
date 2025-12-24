import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private repo: Repository<User>,
    ) { }

    findAll() {
        return this.repo.find();
    }
    async findOneByEmail(email: string): Promise<User | null> {
        return this.repo.findOne({ where: { email } });
    }
    async create(data: CreateUserDto) {
        const existingUser = await this.repo.findOne({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = this.repo.create({
            email: data.email,
            role: data.role,
            passwordHash: hashedPassword,
        });

        return this.repo.save(user);
    }

    async remove(id: number) {
        const result = await this.repo.delete(id);

        if (result.affected === 0) {
            throw new NotFoundException('User not found');
        }

        return { message: 'User deleted successfully' };
    }

    async update(id: number, data: Partial<CreateUserDto>) {
        const user = await this.repo.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        if (data.email && data.email !== user.email) {
            const existing = await this.repo.findOne({
                where: { email: data.email },
            });

            if (existing) {
                throw new ConflictException('User with this email already exists');
            }
        }
        if (data.password) {
            user.passwordHash = await bcrypt.hash(data.password, 10);
        }
        if (data.email) user.email = data.email;
        if (data.role) user.role = data.role;

        return this.repo.save(user);
    }
}
