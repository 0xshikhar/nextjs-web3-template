import { generateNonce, SiweMessage } from 'siwe';
// import { prisma } from './prisma';
import jwt from 'jsonwebtoken';

export async function createAuthMessage(address: string, chainId: number) {
    const nonce = generateNonce();
    const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Next Demo application',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce
    });

    return message.prepareMessage();
}

export async function verifySignature(message: string, signature: string) {
    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.verify({ signature });
    return fields.data;
}

// Define the user type for the JWT payload
export interface JwtPayload {
    userId: string;
    address: string;
    iat?: number;
    exp?: number;
}

// Generate a JWT token
export function generateJwtToken(payload: Omit<JwtPayload, 'iat' | 'exp'>) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    return jwt.sign(payload, secret, { expiresIn: '1d' });
}

// Verify a JWT token
export async function verifyJwtToken(token: string): Promise<JwtPayload> {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                reject(err);
            } else {
                resolve(decoded as JwtPayload);
            }
        });
    });
}
