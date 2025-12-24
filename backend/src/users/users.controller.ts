import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('users')
export class UsersController {
    constructor(private service: UsersService) {}

    @UseGuards(AuthGuard, RolesGuard)
    @Get()
    findAll() { return this.service.findAll(); }

    @UseGuards(AuthGuard, RolesGuard)
    @Post()
    @UsePipes(new ValidationPipe({ whitelist: true }))
    create(@Body() data: CreateUserDto) { return this.service.create(data); }

    @UseGuards(AuthGuard, RolesGuard)
    @Patch(':id')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    update(@Param('id') id: string, @Body() data: Partial<CreateUserDto>) {
        return this.service.update(+id, data);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(+id);
    }
}