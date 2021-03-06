import type { Password, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { isAfter } from "date-fns";


import { prisma } from "~/db.server";

export type { User } from "@prisma/client";

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({ where: { id }, include: { profile: true } });
}

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getAdminUserById(id: User["id"]) {
  return prisma.user.findFirst({ where: { AND: { id, role: { equals: "ADMIN" } } }, include: { profile: true } })
}

export async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      profile: true,
    }
  });
}

export async function createUser(
  firstName: string,
  lastName: string,
  email: User["email"],
  password: string
) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      email,
      profile: {
        create: {
          firstName,
          lastName,
        }
      },
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });
}

export async function updateUserRole(id: User["id"], role: "ADMIN" | "MEMBER") {
  return prisma.user.update({
    data: {
      role
    },
    where: { id }
  })
}

export async function updateUserAuthorizations({ id, authList }: { id: User["id"], authList: string[] }) {
  // TODO: create this after updating schema.
}

export async function deleteUserByEmail(email: User["email"]) {
  return prisma.user.delete({ where: { email } });
}

export async function verifyLogin(
  email: User["email"],
  password: Password["hash"]
) {
  const userWithPassword = await prisma.user.findUnique({
    where: { email },
    include: {
      password: true,
    },
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(
    password,
    userWithPassword.password.hash
  );

  if (!isValid) {
    return null;
  }

  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}

export async function createPasswordResetToken(email: string) {
  console.log(email)
  let user = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (!user) return null;

  // TODO: hook this up to an email service at some point.
  let resetToken = await bcrypt.hash(user.email, 8);
  let expireDate = new Date();
  expireDate.setHours(expireDate.getHours() + 12);

  return prisma.user.update({
    where: { id: user.id }, data: {
      password: {
        update: {

          resetToken: resetToken,
          tokenExpiration: expireDate.toISOString()
        }
      }
    },
    select: {
      id: true,
      password: {
        select: {
          resetToken: true
        }
      }
    }
  });

}

export async function resetPassword({ email, newPassword, token }: { email: string, newPassword: string, token: string }) {
  // check to see if the token matches the user
  console.log({ email, token })
  let verifiedUser = await prisma.user.findFirst({
    where: {
      email,
      AND: {

        password: {
          resetToken: token
        }
      }
    },
    include: {
      password: true
    }
  });
  // if user doesn't exist could have been used or never existed return error message
  if (!verifiedUser || !verifiedUser.password?.resetToken) {
    return {
      user: null,
      error: 'Something went wrong. User or password reset token is invalid. Please try again'
    }
  }

  // if it's expired return error message

  if (verifiedUser.password?.tokenExpiration) {
    let tokenExpired = isAfter(new Date(), new Date(verifiedUser.password.tokenExpiration));
    if (tokenExpired) {
      return {
        user: null,
        error: 'Password reset token expired. Please try again.'
      }
    }
  }

  // if it exists hash the password and update the user
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  let updatedUser = await prisma.user.update({
    where: {
      email
    },
    data: {
      password: {
        update: {
          hash: hashedPassword,
          tokenExpiration: null,
          resetToken: null,
        }

      },
    },
  });
  return { user: updatedUser, error: null }
}