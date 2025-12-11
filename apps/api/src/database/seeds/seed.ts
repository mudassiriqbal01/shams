import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Department, UserDepartmentMembership, Role } from '../entities';
import { PermissionType } from '@shams-vision/shared';

export async function seedDatabase(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();

    // Create departments
    const dept1 = await queryRunner.manager.save(Department, {
      name: 'Engineering',
      description: 'Engineering Department',
    });

    const dept2 = await queryRunner.manager.save(Department, {
      name: 'Sales',
      description: 'Sales Department',
    });

    // Create admin and viewer roles for each department
    const adminRole1 = await queryRunner.manager.save(Role, {
      name: 'Admin',
      departmentId: dept1.id,
      permissions: [
        PermissionType.CAN_VIEW,
        PermissionType.CAN_EDIT_ROWS,
        PermissionType.CAN_EDIT_SCHEMA,
        PermissionType.CAN_EXPORT,
        PermissionType.ROW_LEVEL_SECURITY,
      ],
    });

    const viewerRole1 = await queryRunner.manager.save(Role, {
      name: 'Viewer',
      departmentId: dept1.id,
      permissions: [PermissionType.CAN_VIEW],
    });

    const adminRole2 = await queryRunner.manager.save(Role, {
      name: 'Admin',
      departmentId: dept2.id,
      permissions: [
        PermissionType.CAN_VIEW,
        PermissionType.CAN_EDIT_ROWS,
        PermissionType.CAN_EDIT_SCHEMA,
        PermissionType.CAN_EXPORT,
        PermissionType.ROW_LEVEL_SECURITY,
      ],
    });

    const viewerRole2 = await queryRunner.manager.save(Role, {
      name: 'Viewer',
      departmentId: dept2.id,
      permissions: [PermissionType.CAN_VIEW],
    });

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);

    const user1 = await queryRunner.manager.save(User, {
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      passwordHash: hashedPassword,
      activeDepartmentId: dept1.id,
      tokenVersion: 0,
    });

    const user2 = await queryRunner.manager.save(User, {
      email: 'viewer@example.com',
      firstName: 'Viewer',
      lastName: 'User',
      passwordHash: hashedPassword,
      activeDepartmentId: dept1.id,
      tokenVersion: 0,
    });

    const user3 = await queryRunner.manager.save(User, {
      email: 'sales@example.com',
      firstName: 'Sales',
      lastName: 'User',
      passwordHash: hashedPassword,
      activeDepartmentId: dept2.id,
      tokenVersion: 0,
    });

    // Create memberships
    const membership1 = await queryRunner.manager.save(UserDepartmentMembership, {
      userId: user1.id,
      departmentId: dept1.id,
    });

    const membership2 = await queryRunner.manager.save(UserDepartmentMembership, {
      userId: user2.id,
      departmentId: dept1.id,
    });

    const membership3 = await queryRunner.manager.save(UserDepartmentMembership, {
      userId: user3.id,
      departmentId: dept2.id,
    });

    // Associate roles with memberships
    adminRole1.membership = membership1;
    await queryRunner.manager.save(Role, adminRole1);

    viewerRole1.membership = membership2;
    await queryRunner.manager.save(Role, viewerRole1);

    adminRole2.membership = membership3;
    await queryRunner.manager.save(Role, adminRole2);

    console.log('✅ Database seeded successfully');
    console.log('Test users created:');
    console.log('  - admin@example.com (Admin - Engineering)');
    console.log('  - viewer@example.com (Viewer - Engineering)');
    console.log('  - sales@example.com (Admin - Sales)');
    console.log('All passwords: password123');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
