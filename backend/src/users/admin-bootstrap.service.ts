import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./users.entity";
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminBootstrapService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async bootstrap() {
    const adminExists = await this.usersRepo.findOne({
      where: { role: 'admin' },
    });

    if (adminExists) {
      return;
    }

    const passwordHash = await bcrypt.hash(
      process.env.SUPER_ADMIN_PASSWORD!,
      10,
    );

    const admin = this.usersRepo.create({
      email: process.env.SUPER_ADMIN_EMAIL,
      passwordHash,
      role: 'admin',
    });

    await this.usersRepo.save(admin);
    console.log('Super admin created');
  }
}
