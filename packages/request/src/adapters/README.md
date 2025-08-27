# Adaptadores de Request - AsterFlow

Este diretório contém adaptadores padronizados para diferentes runtimes de servidor web, seguindo o padrão Adapter Pattern para garantir compatibilidade e consistência entre plataformas.

## Padrão Implementado

Todos os adaptadores seguem o mesmo padrão estrutural:

### 1. **Interface Consistente**
- Todos implementam `RequestAbstract`
- Retornam instância de `AsterRequest<Runtime>`
- Seguem nomenclatura padronizada: `create{Runtime}Request`

### 2. **Validação de Entrada**
```typescript
if (!request) {
  throw new Error('[{Runtime}Adapter] Request object is required')
}
```

### 3. **Tratamento de Headers Padronizado**
- Sempre converte chaves para lowercase
- Junta arrays de valores com `', '`
- Trata valores indefinidos adequadamente

### 4. **Método `getBody()` Assíncrono**
- Sempre retorna `Promise<unknown>`
- Implementa tratamento de erro consistente
- Utiliza cache quando aplicável (Node.js)

### 5. **Método `getPathname()` Padronizado**
- Para Bun: extrai pathname + search da URL
- Para Express: usa `originalUrl` ou `url`
- Para Fastify: usa `url`
- Para Node.js: usa `url`
- Fallback para `'/'` em caso de erro

### 6. **Método `getMethod()` Padronizado**
- Sempre retorna em UPPERCASE
- Fallback para `'GET'`

### 7. **Tratamento de Erros Padronizado**
- Prefixo `[{Runtime}Adapter]` em mensagens de erro
- Try-catch em operações que podem falhar
- Mensagens de erro descritivas

### 8. **Documentação JSDoc**
- Descrição da função
- Parâmetros documentados
- Valor de retorno especificado
- Exceções documentadas

## Adaptadores Disponíveis

### Bun (`bun.ts`)
- **Runtime**: `Runtime.Bun`
- **Entrada**: `Request` (Bun native)
- **Características**: Clona request para leitura de body

### Express (`express.ts`)
- **Runtime**: `Runtime.Express`
- **Entrada**: `Request` (Express)
- **Características**: Body já parseado por middleware

### Fastify (`fastify.ts`)
- **Runtime**: `Runtime.Fastify`
- **Entrada**: `FastifyRequest`
- **Características**: Body já parseado pelo framework

### Node.js (`node.ts`)
- **Runtime**: `Runtime.Node`
- **Entrada**: `IncomingMessage`
- **Características**: Implementa parsing manual com cache

## Exemplo de Uso

```typescript
import { createBunRequest } from './adapters/bun'
import { createExpressRequest } from './adapters/express'
import { createFastifyRequest } from './adapters/fastify'
import { createNodeRequest } from './adapters/node'

// Bun
const bunRequest = createBunRequest(request)

// Express
const expressRequest = createExpressRequest(req)

// Fastify
const fastifyRequest = createFastifyRequest(request)

// Node.js
const nodeRequest = createNodeRequest(req)
```

## Vantagens do Padrão

1. **Consistência**: Todos os adaptadores seguem a mesma estrutura
2. **Manutenibilidade**: Código padronizado é mais fácil de manter
3. **Extensibilidade**: Novos adaptadores podem seguir o mesmo padrão
4. **Reliability**: Tratamento de erro consistente
5. **Documentação**: JSDoc padronizado facilita entendimento
6. **Interoperabilidade**: Compatível com outros projetos que seguem padrões similares

## Adicionando Novo Adaptador

Para adicionar suporte a um novo runtime:

1. Crie arquivo `{runtime}.ts`
2. Implemente função `create{Runtime}Request`
3. Siga o padrão de validação, erro e JSDoc
4. Implemente `RequestAbstract` adequadamente
5. Adicione testes apropriados
6. Atualize documentação

---

*Este padrão segue as melhores práticas do Adapter Pattern e princípios SOLID para garantir código robusto e manutenível.*
