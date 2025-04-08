import type { FastifyRequest } from "fastify";
import { IncomingMessage } from 'http';
import { TLSSocket } from "tls";
import { URL } from 'url';

export type AsterRequestTypes = FastifyRequest | Request | IncomingMessage;

export class AsterRequest {
  request: AsterRequestTypes;

  constructor(request: AsterRequestTypes) {
    this.request = request;
  }

  async getBody(): Promise<unknown> {
    if (this.isFastifyRequest()) {
      return this.#handleFastifyBody();
    } else if (this.isFetchRequest()) {
      return this.#handleFetchBody();
    } else if (this.isIncomingMessage()) {
      return this.#handleNodeBody();
    }
    throw new Error('Unsupported request type');
  }

  getParams(): Record<string, string> {
    if (this.isFastifyRequest()) {
      return (this.request as FastifyRequest).params ?? {} as Record<string, string>;
    }
    return this.#getQueryParams();
  }
  

  getURL(): string {
    if (this.isFetchRequest()) {
      return (this.request as Request).url;
    }
    
    if (this.isIncomingMessage()) {
      return this.#getFullURL(this.request as IncomingMessage);
    }
    
    return this.#getFastifyURL(this.request as FastifyRequest);
  }

  getId(): string | undefined {
    if (this.isFastifyRequest()) {
      return (this.request as FastifyRequest).id;
    }
    return undefined;
  }

  getQuery(): Record<string, string> {
    if (this.isFastifyRequest()) {
      return (this.request as FastifyRequest).query ?? {} as Record<string, string>;
    }
    return this.#getQueryParams();
  }

  getHeaders(): Record<string, string> {
    if (this.isFetchRequest()) {
      const headers: Record<string, string> = {};
      (this.request as Request).headers.forEach((value, key) => {
        headers[key] = value;
      });
      return headers;
    }
    
    const headers = (this.request as FastifyRequest | IncomingMessage).headers;
    return Object.entries(headers).reduce((acc, [key, value]) => {
      if (value === undefined) return acc;
      acc[key] = Array.isArray(value) ? value.join(', ') : value;
      return acc;
    }, {} as Record<string, string>);
  }

  getIps(): string[] {
    if (this.isFastifyRequest()) {
      const req = this.request as FastifyRequest;
      return req.ips?.length ? req.ips : (req.ip ? [req.ip] : []);
    } else if (this.isIncomingMessage()) {
      const req = this.request as IncomingMessage;
      const xff = this.getHeaders()['x-forwarded-for'];
      if (xff) {
        return xff.split(',').map(ip => ip.trim());
      }
      const remoteAddress = req.socket?.remoteAddress;
      return remoteAddress ? [remoteAddress] : [];
    } else {
      const xff = this.getHeaders()['x-forwarded-for'];
      return xff ? xff.split(',').map(ip => ip.trim()) : [];
    }
  }
  

  getIp(): string {
    const ips = this.getIps();
    return ips[0] || '';
  }

  getHost(): string {
    return this.parseURL()?.host || '';
  }

  getPort(): string {
    const url = this.parseURL();
    if (!url) return '';
    return url.port || (url.protocol === 'https:' ? '443' : '80');
  }

  getHostname(): string {
    return this.parseURL()?.hostname || '';
  }

  getProtocol(): string {
    const url = this.parseURL();
    return url ? url.protocol.replace(':', '') : 'http';
  }

  private parseURL(): URL | null {
    try {
      return new URL(this.getURL());
    } catch {
      return null;
    }
  }

  isIncomingMessage(): boolean {
    return this.request instanceof IncomingMessage;
  }

  private isFastifyRequest(): boolean {
    return 'router' in this.request;
  }

  private isFetchRequest(): boolean {
    return this.request instanceof Request;
  }

  async #handleFetchBody(): Promise<unknown> {
    const request = this.request as Request;
    return request.clone().json().catch(() => request.text());
  }

  async #handleNodeBody(): Promise<string> {
    const req = this.request as IncomingMessage;
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk.toString()));
      req.on('end', () => resolve(body));
      req.on('error', reject);
    });
  }

  #handleFastifyBody(): unknown {
    return (this.request as FastifyRequest).body;
  }

  #getQueryParams(): Record<string, string> {
    try {
      const url = new URL(
        this.getURL(),
        this.isIncomingMessage() 
          ? `http://${(this.request as IncomingMessage).headers.host}`
          : undefined
      );
      return Object.fromEntries(url.searchParams.entries());
    } catch {
      return {};
    }
  }

  #getFullURL(req: IncomingMessage): string {
    // Type-safe protocol detection
    const isSecure = req?.socket instanceof TLSSocket;
    const protocol = isSecure ? 'https' : 'http';
    
    // Fallback to headers for proxy scenarios
    const forwardedProto = req?.headers['x-forwarded-proto'];
    const finalProtocol = forwardedProto 
      ? String(forwardedProto).split(',')[0]?.trim()
      : protocol;
  
    const host = req.headers.host || 'localhost';
    const url = req.url || '/';
    
    return `${finalProtocol}://${host}${url}`;
  }

  #getFastifyURL(req: FastifyRequest): string {
    return `${req.protocol}://${req.hostname}${req.url}`;
  }
}