import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Earnings } from './earnings.entity';

@Injectable()
export class EarningsService {
  constructor(
    @InjectRepository(Earnings)
    private repo: Repository<Earnings>,
  ) {}

  create(data) {
    return this.repo.save(data);
  }

  findAll() { return this.repo.find({ order: { createdAt: 'DESC' }, }); }

  update(id: number, data) {
    return this.repo.update(id, data);
  }

  delete(id: number) {
    return this.repo.delete(id);
  }
}
