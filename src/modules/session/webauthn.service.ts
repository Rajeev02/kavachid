import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse, RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/server';
import { SessionService } from './session.service';

const rpName = 'KavachID';
const rpID = 'localhost';
const origin = 'http://localhost:8080';

@Injectable()
export class WebauthnService {
  constructor(
    private readonly db: PrismaService,
    private readonly sessionService: SessionService
  ) {}

  async generateRegistrationOptions(tenantId: string, userId: string) {
    const user = await this.db.user.findUnique({ where: { tenantId_id: { tenantId, id: userId } }, include: { passkeys: true } });
    if (!user) throw new BadRequestException('User not found');

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new Uint8Array(Buffer.from(user.id)),
      userName: user.email || user.username || 'user',
      attestationType: 'none',
      excludeCredentials: user.passkeys.map((passkey: any) => ({
        id: passkey.credentialId,
        transports: passkey.transports ? JSON.parse(passkey.transports) : [],
      })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    });

    await this.db.user.update({
      where: { tenantId_id: { tenantId, id: userId } },
      data: { currentWebAuthnChallenge: options.challenge },
    });

    return options;
  }

  async verifyRegistrationResponse(tenantId: string, userId: string, body: RegistrationResponseJSON) {
    const user = await this.db.user.findUnique({ where: { tenantId_id: { tenantId, id: userId } } });
    if (!user || !user.currentWebAuthnChallenge) throw new BadRequestException('User or challenge not found');

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge: user.currentWebAuthnChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }

    if (verification.verified && verification.registrationInfo) {
      const credentialPublicKey = verification.registrationInfo.credential.publicKey;
      const credentialID = verification.registrationInfo.credential.id;
      const counter = verification.registrationInfo.credential.counter;

      await this.db.passkeyCredential.create({
        data: {
          tenantId,
          userId,
          credentialId: Buffer.from(credentialID).toString('base64url'),
          publicKey: Buffer.from(credentialPublicKey),
          counter: BigInt(counter),
          transports: JSON.stringify(body.response.transports || []),
        },
      });

      // Clear challenge
      await this.db.user.update({
        where: { tenantId_id: { tenantId, id: userId } },
        data: { currentWebAuthnChallenge: null },
      });

      return { verified: true };
    }

    throw new BadRequestException('Verification failed');
  }

  async generateAuthenticationOptions(tenantId: string, identifier: string) {
    // Find user by email or username
    const user = await this.db.user.findFirst({
      where: {
        tenantId,
        OR: [{ email: identifier }, { username: identifier }],
      },
      include: { passkeys: true },
    });

    if (!user) throw new BadRequestException('User not found');

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.passkeys.map((passkey: any) => ({
        id: passkey.credentialId,
        transports: passkey.transports ? JSON.parse(passkey.transports) : [],
      })),
      userVerification: 'preferred',
    });

    await this.db.user.update({
      where: { tenantId_id: { tenantId, id: user.id } },
      data: { currentWebAuthnChallenge: options.challenge },
    });

    return options;
  }

  async verifyAuthenticationResponse(
    tenantId: string,
    identifier: string,
    body: AuthenticationResponseJSON,
    dpopProof: string | undefined,
    ipAddress: string,
    userAgent: string,
    clientId?: string
  ) {
    const user = await this.db.user.findFirst({
      where: {
        tenantId,
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user || !user.currentWebAuthnChallenge) throw new BadRequestException('User or challenge not found');

    const passkey = await this.db.passkeyCredential.findUnique({
      where: { credentialId: body.id },
    });

    if (!passkey || passkey.userId !== user.id) throw new BadRequestException('Passkey not found');

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge: user.currentWebAuthnChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: passkey.credentialId,
          publicKey: new Uint8Array(passkey.publicKey),
          counter: Number(passkey.counter),
          transports: passkey.transports ? JSON.parse(passkey.transports) : [],
        },
      });
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }

    if (verification.verified && verification.authenticationInfo) {
      await this.db.passkeyCredential.update({
        where: { id: passkey.id },
        data: { counter: BigInt(verification.authenticationInfo.newCounter) },
      });

      await this.db.user.update({
        where: { tenantId_id: { tenantId, id: user.id } },
        data: { currentWebAuthnChallenge: null },
      });

      // If valid, issue standard DPoP Session
      // Using existing session logic from session.service
      // Note: We bypass password check here since WebAuthn verified them.
      // We will need to expose a method in SessionService to just create session for a user.
      return this.sessionService.createSessionForUser(user, dpopProof, ipAddress, userAgent, clientId);
    }

    throw new BadRequestException('Verification failed');
  }
}
