# concepts: API
URL: /docs/concepts/api
Source: https://raw.githubusercontent.com/better-auth/better-auth/refs/heads/main/docs/content/docs/concepts/api.mdx

Better Auth API.
        
***

title: API
description: Better Auth API.
-----------------------------

When you create a new Better Auth instance, it provides you with an `api` object. This object exposes every endpoint that exists in your Better Auth instance. And you can use this to interact with Better Auth server side.

Any endpoint added to Better Auth, whether from plugins or the core, will be accessible through the `api` object.

## Calling API Endpoints on the Server

To call an API endpoint on the server, import your `auth` instance and call the endpoint using the `api` object.

```ts title="server.ts"
import { betterAuth } from "better-auth";
import { headers } from "next/headers";

export const auth = betterAuth({
    //...
})

// calling get session on the server
await auth.api.getSession({
    headers: await headers() // some endpoints might require headers
})
```

### Body, Headers, Query

Unlike the client, the server needs the values to be passed as an object with the key `body` for the body, `headers` for the headers, and `query` for query parameters.

```ts title="server.ts"
await auth.api.getSession({
    headers: await headers()
})

await auth.api.signInEmail({
    body: {
        email: "john@doe.com",
        password: "password"
    },
    headers: await headers() // optional but would be useful to get the user IP, user agent, etc.
})

await auth.api.verifyEmail({
    query: {
        token: "my_token"
    }
})
```

<Callout>
  Better Auth API endpoints are built on top of [better-call](https://github.com/bekacru/better-call), a tiny web framework that lets you call REST API endpoints as if they were regular functions and allows us to easily infer client types from the server.
</Callout>

### Getting `headers` and `Response` Object

When you invoke an API endpoint on the server, it will return a standard JavaScript object or array directly as it's just a regular function call.

But there are times when you might want to get the `headers` or the `Response` object instead. For example, if you need to get the cookies or the headers.

#### Getting `headers`

To get the `headers`, you can pass the `returnHeaders` option to the endpoint.

```ts
const { headers, response } = await auth.api.signUpEmail({
	returnHeaders: true,
	body: {
		email: "john@doe.com",
		password: "password",
		name: "John Doe",
	},
});
```

The `headers` will be a `Headers` object, which you can use to get the cookies or the headers.

```ts
const cookies = headers.get("set-cookie");
const headers = headers.get("x-custom-header");
```

#### Getting `Response` Object

To get the `Response` object, you can pass the `asResponse` option to the endpoint.

```ts title="server.ts"
const response = await auth.api.signInEmail({
    body: {
        email: "",
        password: ""
    },
    asResponse: true
})
```

### Error Handling

When you call an API endpoint on the server, it will throw an error if the request fails. You can catch the error and handle it as you see fit. The error instance is an instance of `APIError`.

```ts title="server.ts"
import { APIError } from "better-auth/api";

try {
    await auth.api.signInEmail({
        body: {
            email: "",
            password: ""
        }
    })
} catch (error) {
    if (error instanceof APIError) {
        console.log(error.message, error.status)
    }
}
```

# concepts: CLI
URL: /docs/concepts/cli
Source: https://raw.githubusercontent.com/better-auth/better-auth/refs/heads/main/docs/content/docs/concepts/cli.mdx

Built-in CLI for managing your project.
        
***

title: CLI
description: Built-in CLI for managing your project.
----------------------------------------------------

Better Auth comes with a built-in CLI to help you manage the database schemas, initialize your project, generate a secret key for your application, and gather diagnostic information about your setup.

## Generate

The `generate` command creates the schema required by Better Auth. If you're using a database adapter like Prisma or Drizzle, this command will generate the right schema for your ORM. If you're using the built-in Kysely adapter, it will generate an SQL file you can run directly on your database.

```bash title="Terminal"
npx @better-auth/cli@latest generate
```

### Options

* `--output` - Where to save the generated schema. For Prisma, it will be saved in prisma/schema.prisma. For Drizzle, it goes to schema.ts in your project root. For Kysely, it's an SQL file saved as schema.sql in your project root.
* `--config` - The path to your Better Auth config file. By default, the CLI will search for an auth.ts file in **./**, **./utils**, **./lib**, or any of these directories under the `src` directory.
* `--yes` - Skip the confirmation prompt and generate the schema directly.

## Migrate

The migrate command applies the Better Auth schema directly to your database. This is available if you're using the built-in Kysely adapter. For other adapters, you'll need to apply the schema using your ORM's migration tool.

```bash title="Terminal"
npx @better-auth/cli@latest migrate
```

### Options

* `--config` - The path to your Better Auth config file. By default, the CLI will search for an auth.ts file in **./**, **./utils**, **./lib**, or any of these directories under the `src` directory.
* `--yes` - Skip the confirmation prompt and apply the schema directly.

## Init

The `init` command allows you to initialize Better Auth in your project.

```bash title="Terminal"
npx @better-auth/cli@latest init
```

### Options

* `--name` - The name of your application. (defaults to the `name` property in your `package.json`).
* `--framework` - The framework your codebase is using. Currently, the only supported framework is `Next.js`.
* `--plugins` - The plugins you want to use. You can specify multiple plugins by separating them with a comma.
* `--database` - The database you want to use. Currently, the only supported database is `SQLite`.
* `--package-manager` - The package manager you want to use. Currently, the only supported package managers are `npm`, `pnpm`, `yarn`, `bun` (defaults to the manager you used to initialize the CLI).

## Info

The `info` command provides diagnostic information about your Better Auth setup and environment. Useful for debugging and sharing when seeking support.

```bash title="Terminal"
npx @better-auth/cli@latest info
```

### Output

The command displays:

* **System**: OS, CPU, memory, Node.js version
* **Package Manager**: Detected manager and version
* **Better Auth**: Version and configuration (sensitive data auto-redacted)
* **Frameworks**: Detected frameworks (Next.js, React, Vue, etc.)
* **Databases**: Database clients and ORMs (Prisma, Drizzle, etc.)

### Options

* `--config` - Path to your Better Auth config file
* `--json` - Output as JSON for sharing or programmatic use

### Examples

```bash
# Basic usage
npx @better-auth/cli@latest info

# Custom config path
npx @better-auth/cli@latest info --config ./config/auth.ts

# JSON output
npx @better-auth/cli@latest info --json > auth-info.json
```

Sensitive data like secrets, API keys, and database URLs are automatically replaced with `[REDACTED]` for safe sharing.

## Secret

The CLI also provides a way to generate a secret key for your Better Auth instance.

```bash title="Terminal"
npx @better-auth/cli@latest secret
```

## Common Issues

**Error: Cannot find module X**

If you see this error, it means the CLI can't resolve imported modules in your Better Auth config file. We are working on a fix for many of these issues, but in the meantime, you can try the following:

* Remove any import aliases in your config file and use relative paths instead. After running the CLI, you can revert to using aliases.

# concepts: Client
URL: /docs/concepts/client
Source: https://raw.githubusercontent.com/better-auth/better-auth/refs/heads/main/docs/content/docs/concepts/client.mdx

Better Auth client library for authentication.
        
***

title: Client
description: Better Auth client library for authentication.
-----------------------------------------------------------

Better Auth offers a client library compatible with popular frontend frameworks like React, Vue, Svelte, and more. This client library includes a set of functions for interacting with the Better Auth server. Each framework's client library is built on top of a core client library that is framework-agnostic, so that all methods and hooks are consistently available across all client libraries.

## Installation

If you haven't already, install better-auth.

<CodeBlockTabs defaultValue="npm">
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="npm">
      npm
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="pnpm">
      pnpm
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="yarn">
      yarn
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="bun">
      bun
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="npm">
    ```bash
    npm i better-auth
    ```
  </CodeBlockTab>

  <CodeBlockTab value="pnpm">
    ```bash
    pnpm add better-auth
    ```
  </CodeBlockTab>

  <CodeBlockTab value="yarn">
    ```bash
    yarn add better-auth
    ```
  </CodeBlockTab>

  <CodeBlockTab value="bun">
    ```bash
    bun add better-auth
    ```
  </CodeBlockTab>
</CodeBlockTabs>

## Create Client Instance

Import `createAuthClient` from the package for your framework (e.g., "better-auth/react" for React). Call the function to create your client. Pass the base URL of your auth server. If the auth server is running on the same domain as your client, you can skip this step.

<Callout type="info">
  If you're using a different base path other than `/api/auth`, make sure to pass the whole URL, including the path. (e.g., `http://localhost:3000/custom-path/auth`)
</Callout>

<Tabs
  items={["react", "vue", "svelte", "solid", 
"vanilla"]}
  defaultValue="react"
>
  <Tab value="vanilla">
    ```ts title="lib/auth-client.ts" 
    import { createAuthClient } from "better-auth/client"
    export const authClient = createAuthClient({
        baseURL: "http://localhost:3000" // The base URL of your auth server // [!code highlight]
    })
    ```
  </Tab>

  <Tab value="react" title="lib/auth-client.ts">
    ```ts title="lib/auth-client.ts"  
    import { createAuthClient } from "better-auth/react"
    export const authClient = createAuthClient({
        baseURL: "http://localhost:3000" // The base URL of your auth server // [!code highlight]
    })
    ```
  </Tab>

  <Tab value="vue" title="lib/auth-client.ts">
    ```ts title="lib/auth-client.ts" 
    import { createAuthClient } from "better-auth/vue"
    export const authClient = createAuthClient({
        baseURL: "http://localhost:3000" // The base URL of your auth server // [!code highlight]
    })
    ```
  </Tab>

  <Tab value="svelte" title="lib/auth-client.ts">
    ```ts title="lib/auth-client.ts" 
    import { createAuthClient } from "better-auth/svelte"
    export const authClient = createAuthClient({
        baseURL: "http://localhost:3000" // The base URL of your auth server // [!code highlight]
    })
    ```
  </Tab>

  <Tab value="solid" title="lib/auth-client.ts">
    ```ts title="lib/auth-client.ts" 
    import { createAuthClient } from "better-auth/solid"
    export const authClient = createAuthClient({
        baseURL: "http://localhost:3000" // The base URL of your auth server // [!code highlight]
    })
    ```
  </Tab>
</Tabs>

## Usage

Once you've created your client instance, you can use the client to interact with the Better Auth server. The client provides a set of functions by default and they can be extended with plugins.

**Example: Sign In**

```ts title="auth-client.ts"
import { createAuthClient } from "better-auth/client"
const authClient = createAuthClient()

await authClient.signIn.email({
    email: "test@user.com",
    password: "password1234"
})
```

### Hooks

In addition to the standard methods, the client provides hooks to easily access different reactive data. Every hook is available in the root object of the client and they all start with `use`.

**Example: useSession**

<Tabs items={["React", "Vue","Svelte", "Solid"]} defaultValue="react">
  <Tab value="React">
    ```tsx title="user.tsx"
    //make sure you're using the react client
    import { createAuthClient } from "better-auth/react"
    const { useSession } = createAuthClient() // [!code highlight]

    export function User() {
        const {
            data: session,
            isPending, //loading state
            error, //error object 
            refetch //refetch the session
        } = useSession()
        return (
            //...
        )
    }
    ```
  </Tab>

  <Tab value="Vue">
    ```vue title="user.vue"
    <script lang="ts" setup>
    import { authClient } from '@/lib/auth-client'
    const session = authClient.useSession()
    </script>
    <template>
        <div>
            <button v-if="!session.data" @click="() => authClient.signIn.social({
                provider: 'github'
            })">
                Continue with GitHub
            </button>
            <div>
                <pre>{{ session.data }}</pre>
                <button v-if="session.data" @click="authClient.signOut()">
                    Sign out
                </button>
            </div>
        </div>
    </template>
    ```
  </Tab>

  <Tab value="Svelte">
    ```svelte title="user.svelte"
    <script lang="ts">
    import { client } from "$lib/client";
    const session = client.useSession();
    </script>

    <div
        style="display: flex; flex-direction: column; gap: 10px; border-radius: 10px; border: 1px solid #4B453F; padding: 20px; margin-top: 10px;"
    >
        <div>
        {#if $session.data}
            <div>
            <p>
                {$session.data.user.name}
            </p>
            <p>
                {$session.data.user.email}
            </p>
            <button
                onclick={async () => {
                await authClient.signOut();
                }}
            >
                Signout
            </button>
            </div>
        {:else}
            <button
            onclick={async () => {
                await authClient.signIn.social({
                provider: "github",
                });
            }}
            >
            Continue with GitHub
            </button>
        {/if}
        </div>
    </div>
    ```
  </Tab>

  <Tab value="Solid">
    ```tsx title="user.tsx"
    import { client } from "~/lib/client";
    import { Show } from 'solid-js';

    export default function Home() {
        const session = client.useSession()
        return (
            <Show
                when={session()}
                fallback={<button onClick={toggle}>Log in</button>}
            >
                <button onClick={toggle}>Log out</button>
            </Show>
        ); 
    }
    ```
  </Tab>
</Tabs>

### Fetch Options

The client uses a library called [better fetch](https://better-fetch.vercel.app) to make requests to the server.

Better fetch is a wrapper around the native fetch API that provides a more convenient way to make requests. It's created by the same team behind Better Auth and is designed to work seamlessly with it.

You can pass any default fetch options to the client by passing `fetchOptions` object to the `createAuthClient`.

```ts title="auth-client.ts"
import { createAuthClient } from "better-auth/client"

const authClient = createAuthClient({
    fetchOptions: {
        //any better-fetch options
    },
})
```

You can also pass fetch options to most of the client functions. Either as the second argument or as a property in the object.

```ts title="auth-client.ts"
await authClient.signIn.email({
    email: "email@email.com",
    password: "password1234",
}, {
    onSuccess(ctx) {
            //      
    }
})

//or

await authClient.signIn.email({
    email: "email@email.com",
    password: "password1234",
    fetchOptions: {
        onSuccess(ctx) {
            //      
        }
    },
})
```

### Handling Errors

Most of the client functions return a response object with the following properties:

* `data`: The response data.
* `error`: The error object if there was an error.

The error object contains the following properties:

* `message`: The error message. (e.g., "Invalid email or password")
* `status`: The HTTP status code.
* `statusText`: The HTTP status text.

```ts title="auth-client.ts"
const { data, error } = await authClient.signIn.email({
    email: "email@email.com",
    password: "password1234"
})
if (error) {
    //handle error
}
```

If the action accepts a `fetchOptions` option, you can pass an `onError` callback to handle errors.

```ts title="auth-client.ts"

await authClient.signIn.email({
    email: "email@email.com",
    password: "password1234",
}, {
    onError(ctx) {
        //handle error
    }
})

//or
await authClient.signIn.email({
    email: "email@email.com",
    password: "password1234",
    fetchOptions: {
        onError(ctx) {
            //handle error
        }
    }
})
```

Hooks like `useSession` also return an error object if there was an error fetching the session. On top of that, they also return an `isPending` property to indicate if the request is still pending.

```ts title="auth-client.ts"
const { data, error, isPending } = useSession()
if (error) {
    //handle error
}
```

#### Error Codes

The client instance contains $ERROR\_CODES object that contains all the error codes returned by the server. You can use this to handle error translations or custom error messages.

```ts title="auth-client.ts"
const authClient = createAuthClient();

type ErrorTypes = Partial<
	Record<
		keyof typeof authClient.$ERROR_CODES,
		{
			en: string;
			es: string;
		}
	>
>;

const errorCodes = {
	USER_ALREADY_EXISTS: {
		en: "user already registered",
		es: "usuario ya registrada",
	},
} satisfies ErrorTypes;

const getErrorMessage = (code: string, lang: "en" | "es") => {
	if (code in errorCodes) {
		return errorCodes[code as keyof typeof errorCodes][lang];
	}
	return "";
};


const { error } = await authClient.signUp.email({
	email: "user@email.com",
	password: "password",
	name: "User",
});
if(error?.code){
    alert(getErrorMessage(error.code, "en"));
}
```

### Plugins

You can extend the client with plugins to add more functionality. Plugins can add new functions to the client or modify existing ones.

**Example: Magic Link Plugin**

```ts title="auth-client.ts"
import { createAuthClient } from "better-auth/client"
import { magicLinkClient } from "better-auth/client/plugins"

const authClient = createAuthClient({
    plugins: [
        magicLinkClient()
    ]
})
```

once you've added the plugin, you can use the new functions provided by the plugin.

```ts title="auth-client.ts"
await authClient.signIn.magicLink({
    email: "test@email.com"
})
```

# concepts: Cookies
URL: /docs/concepts/cookies
Source: https://raw.githubusercontent.com/better-auth/better-auth/refs/heads/main/docs/content/docs/concepts/cookies.mdx

Learn how cookies are used in Better Auth.
        
***

title: Cookies
description: Learn how cookies are used in Better Auth.
-------------------------------------------------------

Cookies are used to store data such as session tokens, OAuth state, and more. All cookies are signed using the `secret` key provided in the auth options.

### Cookie Prefix

By default, Better Auth cookies follow the format `${prefix}.${cookie_name}`. The default prefix is "better-auth". You can change the prefix by setting `cookiePrefix` in the `advanced` object of the auth options.

```ts title="auth.ts"
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    advanced: {
        cookiePrefix: "my-app"
    }
})
```

### Custom Cookies

All cookies are `httpOnly` and `secure` when the server is running in production mode.

If you want to set custom cookie names and attributes, you can do so by setting `cookieOptions` in the `advanced` object of the auth options.

By default, Better Auth uses the following cookies:

* `session_token` to store the session token
* `session_data` to store the session data if cookie cache is enabled
* `dont_remember` to store the flag when `rememberMe` is disabled

Plugins may also use cookies to store data. For example, the Two Factor Authentication plugin uses the `two_factor` cookie to store the two-factor authentication state.

```ts title="auth.ts"
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    advanced: {
        cookies: {
            session_token: {
                name: "custom_session_token",
                attributes: {
                    // Set custom cookie attributes
                }
            },
        }
    }
})
```

### Cross Subdomain Cookies

Sometimes you may need to share cookies across subdomains.
For example, if you authenticate on `auth.example.com`, you may also want to access the same session on `app.example.com`.

<Callout type="warn">
  The `domain` attribute controls which domains can access the cookie. Setting it to your root domain (e.g. `example.com`) makes the cookie accessible across all subdomains. For security, follow these guidelines:

  1. Only enable cross-subdomain cookies if it's necessary
  2. Set the domain to the most specific scope needed (e.g. `app.example.com` instead of `.example.com`)
  3. Be cautious of untrusted subdomains that could potentially access these cookies
  4. Consider using separate domains for untrusted services (e.g. `status.company.com` vs `app.company.com`)
</Callout>

```ts title="auth.ts"
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    advanced: {
        crossSubDomainCookies: {
            enabled: true,
            domain: "app.example.com", // your domain
        },
    },
    trustedOrigins: [
        'https://example.com',
        'https://app1.example.com',
        'https://app2.example.com',
    ],
})
```

### Secure Cookies

By default, cookies are secure only when the server is running in production mode. You can force cookies to be always secure by setting `useSecureCookies` to `true` in the `advanced` object in the auth options.

```ts title="auth.ts"
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    advanced: {
        useSecureCookies: true
    }
})
```
# concepts: Database
URL: /docs/concepts/database
Source: https://raw.githubusercontent.com/better-auth/better-auth/refs/heads/main/docs/content/docs/concepts/database.mdx

Learn how to use a database with Better Auth.
        
***

title: Database
description: Learn how to use a database with Better Auth.
----------------------------------------------------------

## Adapters

Better Auth requires a database connection to store data. The database will be used to store data such as users, sessions, and more. Plugins can also define their own database tables to store data.

You can pass a database connection to Better Auth by passing a supported database instance in the database options. You can learn more about supported database adapters in the [Other relational databases](/docs/adapters/other-relational-databases) documentation.

## CLI

Better Auth comes with a CLI tool to manage database migrations and generate schema.

### Running Migrations

The cli checks your database and prompts you to add missing tables or update existing ones with new columns. This is only supported for the built-in Kysely adapter. For other adapters, you can use the `generate` command to create the schema and handle the migration through your ORM.

```bash
npx @better-auth/cli migrate
```

### Generating Schema

Better Auth also provides a `generate` command to generate the schema required by Better Auth. The `generate` command creates the schema required by Better Auth. If you're using a database adapter like Prisma or Drizzle, this command will generate the right schema for your ORM. If you're using the built-in Kysely adapter, it will generate an SQL file you can run directly on your database.

```bash
npx @better-auth/cli generate
```

See the [CLI](/docs/concepts/cli) documentation for more information on the CLI.

<Callout>
  If you prefer adding tables manually, you can do that as well. The core schema
  required by Better Auth is described below and you can find additional schema
  required by plugins in the plugin documentation.
</Callout>

## Secondary Storage

Secondary storage in Better Auth allows you to use key-value stores for managing session data, rate limiting counters, etc. This can be useful when you want to offload the storage of this intensive records to a high performance storage or even RAM.

### Implementation

To use secondary storage, implement the `SecondaryStorage` interface:

```typescript
interface SecondaryStorage {
  get: (key: string) => Promise<unknown>; 
  set: (key: string, value: string, ttl?: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
}
```

Then, provide your implementation to the `betterAuth` function:

```typescript
betterAuth({
  // ... other options
  secondaryStorage: {
    // Your implementation here
  },
});
```

<Callout type="warn">
  Better Auth uses **seconds** for the TTL value in `set()`.
  If your storage expects milliseconds, multiply by 1000 when passing the TTL (`ttl * 1000`).
</Callout>

**Example: Redis Implementation**

Here's a basic example using Redis:

```typescript
import { createClient } from "redis";
import { betterAuth } from "better-auth";

const redis = createClient();
await redis.connect();

export const auth = betterAuth({
	// ... other options
	secondaryStorage: {
		get: async (key) => {
			return await redis.get(key);
		},
		set: async (key, value, ttl) => {
			// TTL in seconds — convert ms with ttl * 1000.
			if (ttl) await redis.set(key, value, { EX: ttl });
			// or for ioredis:
			// if (ttl) await redis.set(key, value, 'EX', ttl)
			else await redis.set(key, value);
		},
		delete: async (key) => {
			await redis.del(key);
		}
	}
});
```

This implementation allows Better Auth to use Redis for storing session data and rate limiting counters. You can also add prefixes to the keys names.

## Core Schema

Better Auth requires the following tables to be present in the database. The types are in `typescript` format. You can use corresponding types in your database.

### User

Table Name: `user`

<DatabaseTable
  fields={[
  {
    name: "id",
    type: "string",
    description: "Unique identifier for each user",
    isPrimaryKey: true,
  },
  {
    name: "name",
    type: "string",
    description: "User's chosen display name",
  },
  {
    name: "email",
    type: "string",
    description: "User's email address for communication and login",
  },
  {
    name: "emailVerified",
    type: "boolean",
    description: "Whether the user's email is verified",
  },
  {
    name: "image",
    type: "string",
    description: "User's image url",
    isOptional: true,
  },
  {
    name: "createdAt",
    type: "Date",
    description: "Timestamp of when the user account was created",
  },
  {
    name: "updatedAt",
    type: "Date",
    description: "Timestamp of the last update to the user's information",
  },
]}
/>

### Session

Table Name: `session`

<DatabaseTable
  fields={[
  {
    name: "id",
    type: "string",
    description: "Unique identifier for each session",
    isPrimaryKey: true,
  },
  {
    name: "userId",
    type: "string",
    description: "The ID of the user",
    isForeignKey: true,
  },
  {
    name: "token",
    type: "string",
    description: "The unique session token",
    isUnique: true,
  },
  {
    name: "expiresAt",
    type: "Date",
    description: "The time when the session expires",
  },
  {
    name: "ipAddress",
    type: "string",
    description: "The IP address of the device",
    isOptional: true,
  },
  {
    name: "userAgent",
    type: "string",
    description: "The user agent information of the device",
    isOptional: true,
  },
  {
    name: "createdAt",
    type: "Date",
    description: "Timestamp of when the session was created",
  },
  {
    name: "updatedAt",
    type: "Date",
    description: "Timestamp of when the session was updated",
  },
]}
/>

### Account

Table Name: `account`

<DatabaseTable
  fields={[
  {
    name: "id",
    type: "string",
    description: "Unique identifier for each account",
    isPrimaryKey: true,
  },
  {
    name: "userId",
    type: "string",
    description: "The ID of the user",
    isForeignKey: true,
  },
  {
    name: "accountId",
    type: "string",
    description:
      "The ID of the account as provided by the SSO or equal to userId for credential accounts",
  },
  {
    name: "providerId",
    type: "string",
    description: "The ID of the provider",
  },
  {
    name: "accessToken",
    type: "string",
    description: "The access token of the account. Returned by the provider",
    isOptional: true,
  },
  {
    name: "refreshToken",
    type: "string",
    description: "The refresh token of the account. Returned by the provider",
    isOptional: true,
  },
  {
    name: "accessTokenExpiresAt",
    type: "Date",
    description: "The time when the access token expires",
    isOptional: true,
  },
  {
    name: "refreshTokenExpiresAt",
    type: "Date",
    description: "The time when the refresh token expires",
    isOptional: true,
  },
  {
    name: "scope",
    type: "string",
    description: "The scope of the account. Returned by the provider",
    isOptional: true,
  },
  {
    name: "idToken",
    type: "string",
    description: "The ID token returned from the provider",
    isOptional: true,
  },
  {
    name: "password",
    type: "string",
    description:
      "The password of the account. Mainly used for email and password authentication",
    isOptional: true,
  },
  {
    name: "createdAt",
    type: "Date",
    description: "Timestamp of when the account was created",
  },
  {
    name: "updatedAt",
    type: "Date",
    description: "Timestamp of when the account was updated",
  },
]}
/>

### Verification

Table Name: `verification`

<DatabaseTable
  fields={[
  {
    name: "id",
    type: "string",
    description: "Unique identifier for each verification",
    isPrimaryKey: true,
  },
  {
    name: "identifier",
    type: "string",
    description: "The identifier for the verification request",
  },
  {
    name: "value",
    type: "string",
    description: "The value to be verified",
  },
  {
    name: "expiresAt",
    type: "Date",
    description: "The time when the verification request expires",
  },
  {
    name: "createdAt",
    type: "Date",
    description: "Timestamp of when the verification request was created",
  },
  {
    name: "updatedAt",
    type: "Date",
    description: "Timestamp of when the verification request was updated",
  },
]}
/>

## Custom Tables

Better Auth allows you to customize the table names and column names for the core schema. You can also extend the core schema by adding additional fields to the user and session tables.

### Custom Table Names

You can customize the table names and column names for the core schema by using the `modelName` and `fields` properties in your auth config:

```ts title="auth.ts"
export const auth = betterAuth({
  user: {
    modelName: "users",
    fields: {
      name: "full_name",
      email: "email_address",
    },
  },
  session: {
    modelName: "user_sessions",
    fields: {
      userId: "user_id",
    },
  },
});
```

<Callout>
  Type inference in your code will still use the original field names (e.g.,
  `user.name`, not `user.full_name`).
</Callout>

To customize table names and column name for plugins, you can use the `schema` property in the plugin config:

```ts title="auth.ts"
import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    twoFactor({
      schema: {
        user: {
          fields: {
            twoFactorEnabled: "two_factor_enabled",
            secret: "two_factor_secret",
          },
        },
      },
    }),
  ],
});
```

### Extending Core Schema

Better Auth provides a type-safe way to extend the `user` and `session` schemas. You can add custom fields to your auth config, and the CLI will automatically update the database schema. These additional fields will be properly inferred in functions like `useSession`, `signUp.email`, and other endpoints that work with user or session objects.

To add custom fields, use the `additionalFields` property in the `user` or `session` object of your auth config. The `additionalFields` object uses field names as keys, with each value being a `FieldAttributes` object containing:

* `type`: The data type of the field (e.g., "string", "number", "boolean").
* `required`: A boolean indicating if the field is mandatory.
* `defaultValue`: The default value for the field (note: this only applies in the JavaScript layer; in the database, the field will be optional).
* `input`: This determines whether a value can be provided when creating a new record (default: `true`). If there are additional fields, like `role`, that should not be provided by the user during signup, you can set this to `false`.

Here's an example of how to extend the user schema with additional fields:

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, // don't allow user to set role
      },
      lang: {
        type: "string",
        required: false,
        defaultValue: "en",
      },
    },
  },
});
```

Now you can access the additional fields in your application logic.

```ts
//on signup
const res = await auth.api.signUpEmail({
  email: "test@example.com",
  password: "password",
  name: "John Doe",
  lang: "fr",
});

//user object
res.user.role; // > "admin"
res.user.lang; // > "fr"
```

<Callout>
  See the
  [TypeScript](/docs/concepts/typescript#inferring-additional-fields-on-client)
  documentation for more information on how to infer additional fields on the
  client side.
</Callout>

If you're using social / OAuth providers, you may want to provide `mapProfileToUser` to map the profile data to the user object. So, you can populate additional fields from the provider's profile.

**Example: Mapping Profile to User For `firstName` and `lastName`**

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  socialProviders: {
    github: {
      clientId: "YOUR_GITHUB_CLIENT_ID",
      clientSecret: "YOUR_GITHUB_CLIENT_SECRET",
      mapProfileToUser: (profile) => {
        return {
          firstName: profile.name.split(" ")[0],
          lastName: profile.name.split(" ")[1],
        };
      },
    },
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      mapProfileToUser: (profile) => {
        return {
          firstName: profile.given_name,
          lastName: profile.family_name,
        };
      },
    },
  },
});
```

### ID Generation

Better Auth by default will generate unique IDs for users, sessions, and other entities. If you want to customize how IDs are generated, you can configure this in the `advanced.database.generateId` option in your auth config.

You can also disable ID generation by setting the `advanced.database.generateId` option to `false`. This will assume your database will generate the ID automatically.

**Example: Automatic Database IDs**

```ts title="auth.ts"
import { betterAuth } from "better-auth";
import { db } from "./db";

export const auth = betterAuth({
  database: db,
  advanced: {
    database: {
      generateId: false,
    },
  },
});
```

**Example: Using a Custom ID Generator**

```ts title="auth.ts"
import { betterAuth } from "better-auth";
import { db } from "./db";

export const auth = betterAuth({
  database: db,
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
});
```

### Numeric IDs

If you prefer auto-incrementing numeric IDs, you can set the `advanced.database.useNumberId` option to `true`.
Doing this will disable Better-Auth from generating IDs for any table, and will assume your
database will generate the numeric ID automatically.

When enabled, the Better-Auth CLI will generate or migrate the schema with the `id` field as a numeric type for your database
with auto-incrementing attributes associated with it.

```ts
import { betterAuth } from "better-auth";
import { db } from "./db";

export const auth = betterAuth({
  database: db,
  advanced: {
    database: {
      useNumberId: true,
    },
  },
});
```

<Callout type="info">
  Better-Auth will continue to infer the type of the `id` field as a `string` for the database, but will
  automatically convert it to a numeric type when fetching or inserting data from the database.

  It's likely when grabbing `id` values returned from Better-Auth that you'll receive a string version of a number,
  this is normal. It's also expected that all id values passed to Better-Auth (eg via an endpoint body) is expected to be a string.
</Callout>

### Database Hooks

Database hooks allow you to define custom logic that can be executed during the lifecycle of core database operations in Better Auth. You can create hooks for the following models: **user**, **session**, and **account**.

<Callout type="warn">
  Additional fields are supported, however full type inference for these fields isn't yet supported.
  Improved type support is planned.
</Callout>

There are two types of hooks you can define:

#### 1. Before Hook

* **Purpose**: This hook is called before the respective entity (user, session, or account) is created or updated.
* **Behavior**: If the hook returns `false`, the operation will be aborted. And If it returns a data object, it'll replace the original payload.

#### 2. After Hook

* **Purpose**: This hook is called after the respective entity is created or updated.
* **Behavior**: You can perform additional actions or modifications after the entity has been successfully created or updated.

**Example Usage**

```typescript title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          // Modify the user object before it is created
          return {
            data: {
              // Ensure to return Better-Auth named fields, not the original field names in your database.
              ...user,
              firstName: user.name.split(" ")[0],
              lastName: user.name.split(" ")[1],
            },
          };
        },
        after: async (user) => {
          //perform additional actions, like creating a stripe customer
        },
      },
    },
  },
});
```

#### Throwing Errors

If you want to stop the database hook from proceeding, you can throw errors using the `APIError` class imported from `better-auth/api`.

```typescript title="auth.ts"
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";

export const auth = betterAuth({
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          if (user.isAgreedToTerms === false) {
            // Your special condition.
            // Send the API error.
            throw new APIError("BAD_REQUEST", {
              message: "User must agree to the TOS before signing up.",
            });
          }
          return {
            data: user,
          };
        },
      },
    },
  },
});
```

#### Using the Context Object

The context object (`ctx`), passed as the second argument to the hook, contains useful information. For `update` hooks, this includes the current `session`, which you can use to access the logged-in user's details.

```typescript title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  databaseHooks: {
    user: {
      update: {
        before: async (data, ctx) => {
          // You can access the session from the context object.
          if (ctx.context.session) {
            console.log("User update initiated by:", ctx.context.session.userId);
          }
          return { data };
        },
      },
    },
  },
});
```

Much like standard hooks, database hooks also provide a `ctx` object that offers a variety of useful properties. Learn more in the [Hooks Documentation](/docs/concepts/hooks#ctx).

## Plugins Schema

Plugins can define their own tables in the database to store additional data. They can also add columns to the core tables to store additional data. For example, the two factor authentication plugin adds the following columns to the `user` table:

* `twoFactorEnabled`: Whether two factor authentication is enabled for the user.
* `twoFactorSecret`: The secret key used to generate TOTP codes.
* `twoFactorBackupCodes`: Encrypted backup codes for account recovery.

To add new tables and columns to your database, you have two options:

`CLI`: Use the migrate or generate command. These commands will scan your database and guide you through adding any missing tables or columns.
`Manual Method`: Follow the instructions in the plugin documentation to manually add tables and columns.

Both methods ensure your database schema stays up to date with your plugins' requirements.
# concepts: Email
URL: /docs/concepts/email
Source: https://raw.githubusercontent.com/better-auth/better-auth/refs/heads/main/docs/content/docs/concepts/email.mdx

Learn how to use email with Better Auth.
        
***

title: Email
description: Learn how to use email with Better Auth.
-----------------------------------------------------

Email is a key part of Better Auth, required for all users regardless of their authentication method. Better Auth provides email and password authentication out of the box, and a lot of utilities to help you manage email verification, password reset, and more.

## Email Verification

Email verification is a security feature that ensures users provide a valid email address. It helps prevent spam and abuse by confirming that the email address belongs to the user. In this guide, you'll get a walk through of how to implement token based email verification in your app.
To use otp based email verification, check out the [OTP Verification](/docs/plugins/email-otp) guide.

### Adding Email Verification to Your App

To enable email verification, you need to pass a function that sends a verification email with a link.

* **sendVerificationEmail**: This function is triggered when email verification starts. It accepts a data object with the following properties:
  * `user`: The user object containing the email address.
  * `url`: The verification URL the user must click to verify their email.
  * `token`: The verification token used to complete the email verification to be used when implementing a custom verification URL.

and a `request` object as the second parameter.

```ts title="auth.ts"
import { betterAuth } from 'better-auth';
import { sendEmail } from './email'; // your email sending function

export const auth = betterAuth({
    emailVerification: {
        sendVerificationEmail: async ({ user, url, token }, request) => {
            await sendEmail({
                to: user.email,
                subject: 'Verify your email address',
                text: `Click the link to verify your email: ${url}`
            })
        }
    }
})
```

### Triggering Email Verification

You can initiate email verification in several ways:

#### 1. During Sign-up

To automatically send a verification email at signup, set `emailVerification.sendOnSignUp` to `true`.

```ts title="auth.ts"
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
    emailVerification: {
        sendOnSignUp: true
    }
})
```

This sends a verification email when a user signs up. For social logins, email verification status is read from the SSO.

<Callout>
  With `sendOnSignUp` enabled, when the user logs in with an SSO that does not claim the email as verified, Better Auth will dispatch a verification email, but the verification is not required to login even when `requireEmailVerification` is enabled.
</Callout>

#### 2. Require Email Verification

If you enable require email verification, users must verify their email before they can log in. And every time a user tries to sign in, `sendVerificationEmail` is called.

<Callout>
  This only works if you have `sendVerificationEmail` implemented and if the user is trying to sign in with email and password.
</Callout>

```ts title="auth.ts"
export const auth = betterAuth({
    emailAndPassword: {
        requireEmailVerification: true
    }
})
```

if a user tries to sign in without verifying their email, you can handle the error and show a message to the user.

```ts title="auth-client.ts"
await authClient.signIn.email({
    email: "email@example.com",
    password: "password"
}, {
    onError: (ctx) => {
        // Handle the error
        if(ctx.error.status === 403) {
            alert("Please verify your email address")
        }
        //you can also show the original error message
        alert(ctx.error.message)
    }
})
```

#### 3. Manually

You can also manually trigger email verification by calling `sendVerificationEmail`.

```ts
await authClient.sendVerificationEmail({
    email: "user@email.com",
    callbackURL: "/" // The redirect URL after verification
})
```

### Verifying the Email

If the user clicks the provided verification URL, their email is automatically verified, and they are redirected to the `callbackURL`.

For manual verification, you can send the user a custom link with the `token` and call the `verifyEmail` function.

```ts
await authClient.verifyEmail({
    query: {
        token: "" // Pass the token here
    }
})
```

### Auto Sign In After Verification

To sign in the user automatically after they successfully verify their email, set the `autoSignInAfterVerification` option to `true`:

```ts
const auth = betterAuth({
    //...your other options
    emailVerification: {
        autoSignInAfterVerification: true
    }
})
```

### Callback after successful email verification

You can run custom code immediately after a user verifies their email using the `afterEmailVerification` callback. This is useful for any side-effects you want to trigger, like granting access to special features or logging the event.

The `afterEmailVerification` function runs automatically when a user's email is confirmed, receiving the `user` object and `request` details so you can perform actions for that specific user.

Here's how you can set it up:

```ts title="auth.ts"
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
    emailVerification: {
        async afterEmailVerification(user, request) {
            // Your custom logic here, e.g., grant access to premium features
            console.log(`${user.email} has been successfully verified!`);
        }
    }
})
```

## Password Reset Email

Password reset allows users to reset their password if they forget it. Better Auth provides a simple way to implement password reset functionality.

You can enable password reset by passing a function that sends a password reset email with a link.

```ts title="auth.ts"
import { betterAuth } from 'better-auth';
import { sendEmail } from './email'; // your email sending function

export const auth = betterAuth({
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url, token }, request) => {
            await sendEmail({
                to: user.email,
                subject: 'Reset your password',
                text: `Click the link to reset your password: ${url}`
            })
        }
    }
})
```

Check out the [Email and Password](/docs/authentication/email-password#forget-password) guide for more details on how to implement password reset in your app.
Also you can check out the [Otp verification](/docs/plugins/email-otp#reset-password) guide for how to implement password reset with OTP in your app.

# concepts: Hooks
URL: /docs/concepts/hooks
Source: https://raw.githubusercontent.com/better-auth/better-auth/refs/heads/main/docs/content/docs/concepts/hooks.mdx

Better Auth Hooks let you customize BetterAuth's behavior
        
***

title: Hooks
description: Better Auth Hooks let you customize BetterAuth's behavior
----------------------------------------------------------------------

Hooks in Better Auth let you "hook into" the lifecycle and execute custom logic. They provide a way to customize Better Auth's behavior without writing a full plugin.

<Callout>
  We highly recommend using hooks if you need to make custom adjustments to an endpoint rather than making another endpoint outside of Better Auth.
</Callout>

## Before Hooks

**Before hooks** run *before* an endpoint is executed. Use them to modify requests, pre validate data, or return early.

### Example: Enforce Email Domain Restriction

This hook ensures that users can only sign up if their email ends with `@example.com`:

```ts title="auth.ts"
import { betterAuth } from "better-auth";
import { createAuthMiddleware, APIError } from "better-auth/api";

export const auth = betterAuth({
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            if (ctx.path !== "/sign-up/email") {
                return;
            }
            if (!ctx.body?.email.endsWith("@example.com")) {
                throw new APIError("BAD_REQUEST", {
                    message: "Email must end with @example.com",
                });
            }
        }),
    },
});
```

### Example: Modify Request Context

To adjust the request context before proceeding:

```ts title="auth.ts"
import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";

export const auth = betterAuth({
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            if (ctx.path === "/sign-up/email") {
                return {
                    context: {
                        ...ctx,
                        body: {
                            ...ctx.body,
                            name: "John Doe",
                        },
                    }
                };
            }
        }),
    },
});
```

## After Hooks

**After hooks** run *after* an endpoint is executed. Use them to modify responses.

### Example: Send a notification to your channel when a new user is registered

```ts title="auth.ts"
import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { sendMessage } from "@/lib/notification"

export const auth = betterAuth({
    hooks: {
        after: createAuthMiddleware(async (ctx) => {
            if(ctx.path.startsWith("/sign-up")){
                const newSession = ctx.context.newSession;
                if(newSession){
                    sendMessage({
                        type: "user-register",
                        name: newSession.user.name,
                    })
                }
            }
        }),
    },
});
```

## Ctx

When you call `createAuthMiddleware` a `ctx` object is passed that provides a lot of useful properties. Including:

* **Path:** `ctx.path` to get the current endpoint path.
* **Body:** `ctx.body` for parsed request body (available for POST requests).
* **Headers:** `ctx.headers` to access request headers.
* **Request:** `ctx.request` to access the request object (may not exist in server-only endpoints).
* **Query Parameters:** `ctx.query` to access query parameters.
* **Context**: `ctx.context` auth related context, useful for accessing new session, auth cookies configuration, password hashing, config...

and more.

### Request Response

This utilities allows you to get request information and to send response from a hook.

#### JSON Responses

Use `ctx.json` to send JSON responses:

```ts
const hook = createAuthMiddleware(async (ctx) => {
    return ctx.json({
        message: "Hello World",
    });
});
```

#### Redirects

Use `ctx.redirect` to redirect users:

```ts
import { createAuthMiddleware } from "better-auth/api";

const hook = createAuthMiddleware(async (ctx) => {
    throw ctx.redirect("/sign-up/name");
});
```

#### Cookies

* Set cookies: `ctx.setCookies` or `ctx.setSignedCookie`.
* Get cookies: `ctx.getCookies` or `ctx.getSignedCookie`.

Example:

```ts
import { createAuthMiddleware } from "better-auth/api";

const hook = createAuthMiddleware(async (ctx) => {
    ctx.setCookies("my-cookie", "value");
    await ctx.setSignedCookie("my-signed-cookie", "value", ctx.context.secret, {
        maxAge: 1000,
    });

    const cookie = ctx.getCookies("my-cookie");
    const signedCookie = await ctx.getSignedCookie("my-signed-cookie");
});
```

#### Errors

Throw errors with `APIError` for a specific status code and message:

```ts
import { createAuthMiddleware, APIError } from "better-auth/api";

const hook = createAuthMiddleware(async (ctx) => {
    throw new APIError("BAD_REQUEST", {
        message: "Invalid request",
    });
});
```

### Context

The `ctx` object contains another `context` object inside that's meant to hold contexts related to auth. Including a newly created session on after hook, cookies configuration, password hasher and so on.

#### New Session

The newly created session after an endpoint is run. This only exist in after hook.

```ts title="auth.ts"
createAuthMiddleware(async (ctx) => {
    const newSession = ctx.context.newSession
});
```

#### Returned

The returned value from the hook is passed to the next hook in the chain.

```ts title="auth.ts"
createAuthMiddleware(async (ctx) => {
    const returned = ctx.context.returned; //this could be a successful response or an APIError
});
```

#### Response Headers

The response headers added by endpoints and hooks that run before this hook.

```ts title="auth.ts"
createAuthMiddleware(async (ctx) => {
    const responseHeaders = ctx.context.responseHeaders;
});
```

#### Predefined Auth Cookies

Access BetterAuth’s predefined cookie properties:

```ts title="auth.ts"
createAuthMiddleware(async (ctx) => {
    const cookieName = ctx.context.authCookies.sessionToken.name;
});
```

#### Secret

You can access the `secret` for your auth instance on `ctx.context.secret`

#### Password

The password object provider `hash` and `verify`

* `ctx.context.password.hash`: let's you hash a given password.
* `ctx.context.password.verify`: let's you verify given `password` and a `hash`.

#### Adapter

Adapter exposes the adapter methods used by Better Auth. Including `findOne`, `findMany`, `create`, `delete`, `update` and `updateMany`. You generally should use your actually `db` instance from your orm rather than this adapter.

#### Internal Adapter

These are calls to your db that perform specific actions. `createUser`, `createSession`, `updateSession`...

This may be useful to use instead of using your db directly to get access to `databaseHooks`, proper `secondaryStorage` support and so on. If you're make a query similar to what exist in this internal adapter actions it's worth a look.

#### generateId

You can use `ctx.context.generateId` to generate Id for various reasons.

## Reusable Hooks

If you need to reuse a hook across multiple endpoints, consider creating a plugin. Learn more in the [Plugins Documentation](/docs/concepts/plugins).

# concepts: Plugins
URL: /docs/concepts/plugins
Source: https://raw.githubusercontent.com/better-auth/better-auth/refs/heads/main/docs/content/docs/concepts/plugins.mdx

Learn how to use plugins with Better Auth.
        
***

title: Plugins
description: Learn how to use plugins with Better Auth.
-------------------------------------------------------

Plugins are a key part of Better Auth, they let you extend the base functionalities. You can use them to add new authentication methods, features, or customize behaviors.

Better Auth comes with many built-in plugins ready to use. Check the plugins section for details. You can also create your own plugins.

## Using a Plugin

Plugins can be a server-side plugin, a client-side plugin, or both.

To add a plugin on the server, include it in the `plugins` array in your auth configuration. The plugin will initialize with the provided options.

```ts title="server.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
    plugins: [
        // Add your plugins here
    ]
});
```

Client plugins are added when creating the client. Most plugin require both server and client plugins to work correctly.
The Better Auth auth client on the frontend uses the `createAuthClient` function provided by `better-auth/client`.

```ts title="auth-client.ts"
import { createAuthClient } from "better-auth/client";

const authClient =  createAuthClient({
    plugins: [
        // Add your client plugins here
    ]
});
```

We recommend keeping the auth-client and your normal auth instance in separate files.

<Files>
  <Folder name="auth" defaultOpen>
    <File name="server.ts" />

    <File name="auth-client.ts" />
  </Folder>
</Files>

## Creating a Plugin

To get started, you'll need a server plugin.
Server plugins are the backbone of all plugins, and client plugins are there to provide an interface with frontend APIs to easily work with your server plugins.

<Callout type="info">
  If your server plugins has endpoints that needs to be called from the client, you'll also need to create a client plugin.
</Callout>

### What can a plugin do?

* Create custom `endpoint`s to perform any action you want.
* Extend database tables with custom `schemas`.
* Use a `middleware` to target a group of routes using it's route matcher, and run only when those routes are called through a request.
* Use `hooks` to target a specific route or request. And if you want to run the hook even if the endpoint is called directly.
* Use `onRequest` or `onResponse` if you want to do something that affects all requests or responses.
* Create custom `rate-limit` rule.

## Create a Server plugin

To create a server plugin you need to pass an object that satisfies the `BetterAuthPlugin` interface.

The only required property is `id`, which is a unique identifier for the plugin.
Both server and client plugins can use the same `id`.

```ts title="plugin.ts"
import type { BetterAuthPlugin } from "better-auth";

export const myPlugin = ()=>{
    return {
        id: "my-plugin",
    } satisfies BetterAuthPlugin
}
```

<Callout>
  You don't have to make the plugin a function, but it's recommended to do so. This way you can pass options to the plugin and it's consistent with the built-in plugins.
</Callout>

### Endpoints

To add endpoints to the server, you can pass `endpoints` which requires an object with the key being any `string` and the value being an `AuthEndpoint`.

To create an Auth Endpoint you'll need to import `createAuthEndpoint` from `better-auth`.

Better Auth uses wraps around another library called <Link href="https://github.com/bekacru/better-call"> Better Call </Link> to create endpoints. Better call is a simple ts web framework made by the same team behind Better Auth.

```ts title="plugin.ts"
import { createAuthEndpoint } from "better-auth/api";

const myPlugin = ()=> {
    return {
        id: "my-plugin",
        endpoints: {
            getHelloWorld: createAuthEndpoint("/my-plugin/hello-world", {
                method: "GET",
            }, async(ctx) => {
                return ctx.json({
                    message: "Hello World"
                })
            })
        }
    } satisfies BetterAuthPlugin
}
```

Create Auth endpoints wraps around `createEndpoint` from Better Call. Inside the `ctx` object, it'll provide another object called `context` that give you access better-auth specific contexts including `options`, `db`, `baseURL` and more.

**Context Object**

* `appName`: The name of the application. Defaults to "Better Auth".
* `options`: The options passed to the Better Auth instance.
* `tables`:  Core tables definition. It is an object which has the table name as the key and the schema definition as the value.
* `baseURL`: the baseURL of the auth server. This includes the path. For example, if the server is running on `http://localhost:3000`, the baseURL will be `http://localhost:3000/api/auth` by default unless changed by the user.
* `session`: The session configuration. Includes `updateAge` and `expiresIn` values.
* `secret`: The secret key used for various purposes. This is defined by the user.
* `authCookie`: The default cookie configuration for core auth cookies.
* `logger`: The logger instance used by Better Auth.
* `db`: The Kysely instance used by Better Auth to interact with the database.
* `adapter`: This is the same as db but it give you `orm` like functions to interact with the database. (we recommend using this over `db` unless you need raw sql queries or for performance reasons)
* `internalAdapter`: These are internal db calls that are used by Better Auth. For example, you can use these calls to create a session instead of using `adapter` directly. `internalAdapter.createSession(userId)`
* `createAuthCookie`: This is a helper function that let's you get a cookie `name` and `options` for either to `set` or `get` cookies. It implements things like `__secure` prefix and `__host` prefix for cookies based on

For other properties, you can check the <Link href="https://github.com/bekacru/better-call">Better Call</Link> documentation and the <Link href="https://github.com/better-auth/better-auth/blob/main/packages/better-auth/src/init.ts">source code </Link>.

**Rules for Endpoints**

* Makes sure you use kebab-case for the endpoint path
* Make sure to only use `POST` or `GET` methods for the endpoints.
* Any function that modifies a data should be a `POST` method.
* Any function that fetches data should be a `GET` method.
* Make sure to use the `createAuthEndpoint` function to create API endpoints.
* Make sure your paths are unique to avoid conflicts with other plugins. If you're using a common path, add the plugin name as a prefix to the path. (`/my-plugin/hello-world` instead of `/hello-world`.)

### Schema

You can define a database schema for your plugin by passing a `schema` object. The schema object should have the table name as the key and the schema definition as the value.

```ts title="plugin.ts"
import { BetterAuthPlugin } from "better-auth/plugins";

const myPlugin = ()=> {
    return {
        id: "my-plugin",
        schema: {
            myTable: {
                fields: {
                    name: {
                        type: "string"
                    }
                },
                modelName: "myTable" // optional if you want to use a different name than the key
            }
        }
    } satisfies BetterAuthPlugin
}
```

**Fields**

By default better-auth will create an `id` field for each table. You can add additional fields to the table by adding them to the `fields` object.

The key is the column name and the value is the column definition. The column definition can have the following properties:

`type`: The type of the field. It can be `string`, `number`, `boolean`, `date`.

`required`:  if the field should be required on a new record. (default: `false`)

`unique`: if the field should be unique. (default: `false`)

`reference`: if the field is a reference to another table. (default: `null`) It takes an object with the following properties:

* `model`: The table name to reference.
* `field`: The field name to reference.
* `onDelete`: The action to take when the referenced record is deleted. (default: `null`)

**Other Schema Properties**

`disableMigration`: if the table should not be migrated. (default: `false`)

```ts title="plugin.ts"
const myPlugin = (opts: PluginOptions)=>{
    return {
        id: "my-plugin",
        schema: {
            rateLimit: {
                fields: {
                    key: {
                        type: "string",
                    },
                },
                disableMigration: opts.storage.provider !== "database", // [!code highlight]
            },
        },
    } satisfies BetterAuthPlugin
}
```

if you add additional fields to a `user` or `session` table, the types will be inferred automatically on `getSession` and `signUpEmail` calls.

```ts title="plugin.ts"

const myPlugin = ()=>{
    return {
        id: "my-plugin",
        schema: {
            user: {
                fields: {
                    age: {
                        type: "number",
                    },
                },
            },
        },
    } satisfies BetterAuthPlugin
}
```

This will add an `age` field to the `user` table and all `user` returning endpoints will include the `age` field and it'll be inferred properly by typescript.

<Callout type="warn">
  Don't store sensitive information in `user` or `session` table. Crate a new table if you need to store sensitive information.
</Callout>

### Hooks

Hooks are used to run code before or after an action is performed, either from a client or directly on the server. You can add hooks to the server by passing a `hooks` object, which should contain `before` and `after` properties.

```ts title="plugin.ts"
import {  createAuthMiddleware } from "better-auth/plugins";

const myPlugin = ()=>{
    return {
        id: "my-plugin",
        hooks: {
            before: [{
                    matcher: (context)=>{
                        return context.headers.get("x-my-header") === "my-value"
                    },
                    handler: createAuthMiddleware(async (ctx)=>{
                        //do something before the request
                        return  {
                            context: ctx // if you want to modify the context
                        }
                    })
                }],
            after: [{
                matcher: (context)=>{
                    return context.path === "/sign-up/email"
                },
                handler: createAuthMiddleware(async (ctx)=>{
                    return ctx.json({
                        message: "Hello World"
                    }) // if you want to modify the response
                })
            }]
        }
    } satisfies BetterAuthPlugin
}
```

### Middleware

You can add middleware to the server by passing a `middlewares` array. This array should contain middleware objects, each with a `path` and a `middleware` property. Unlike hooks, middleware only runs on `api` requests from a client. If the endpoint is invoked directly, the middleware will not run.

The `path` can be either a string or a path matcher, using the same path-matching system as `better-call`.

If you throw an `APIError` from the middleware or returned a `Response` object, the request will be stopped and the response will be sent to the client.

```ts title="plugin.ts"
const myPlugin = ()=>{
    return {
        id: "my-plugin",
        middlewares: [
            {
                path: "/my-plugin/hello-world",
                middleware: createAuthMiddleware(async(ctx)=>{
                    //do something
                })
            }
        ]
    } satisfies BetterAuthPlugin
}
```

### On Request & On Response

Additional to middlewares, you can also hook into right before a request is made and right after a response is returned. This is mostly useful if you want to do something that affects all requests or responses.

#### On Request

The `onRequest` function is called right before the request is made. It takes two parameters: the `request` and the `context` object.

Here’s how it works:

* **Continue as Normal**: If you don't return anything, the request will proceed as usual.
* **Interrupt the Request**: To stop the request and send a response, return an object with a `response` property that contains a `Response` object.
* **Modify the Request**: You can also return a modified `request` object to change the request before it's sent.

```ts title="plugin.ts"
const myPlugin = ()=> {
    return  {
        id: "my-plugin",
        onRequest: async (request, context) => {
            //do something
        },
    } satisfies BetterAuthPlugin
}
```

#### On Response

The `onResponse` function is executed immediately after a response is returned. It takes two parameters: the `response` and the `context` object.

Here’s how to use it:

* **Modify the Response**: You can return a modified response object to change the response before it is sent to the client.
* **Continue Normally**: If you don't return anything, the response will be sent as is.

```ts title="plugin.ts"
const myPlugin = ()=>{
    return {
        id: "my-plugin",
        onResponse: async (response, context) => {
            //do something
        },
    } satisfies BetterAuthPlugin
}
```

### Rate Limit

You can define custom rate limit rules for your plugin by passing a `rateLimit` array. The rate limit array should contain an array of rate limit objects.

```ts title="plugin.ts"
const myPlugin = ()=>{
    return {
        id: "my-plugin",
        rateLimit: [
            {
                pathMatcher: (path)=>{
                    return path === "/my-plugin/hello-world"
                },
                limit: 10,
                window: 60,
            }
        ]
    } satisfies BetterAuthPlugin
}
```

### Server-plugin helper functions

Some additional helper functions for creating server plugins.

#### `getSessionFromCtx`

Allows you to get the client's session data by passing the auth middleware's `context`.

```ts title="plugin.ts"
import {  createAuthMiddleware } from "better-auth/plugins";
import { getSessionFromCtx } from "better-auth/api";

const myPlugin = {
    id: "my-plugin",
    hooks: {
        before: [{
                matcher: (context)=>{
                    return context.headers.get("x-my-header") === "my-value"
                },
                handler: createAuthMiddleware(async (ctx) => {
                    const session = await getSessionFromCtx(ctx);
                    //do something with the client's session.

                    return  {
                        context: ctx
                    }
                })
            }],
    }
} satisfies BetterAuthPlugin
```

#### `sessionMiddleware`

A middleware that checks if the client has a valid session. If the client has a valid session, it'll add the session data to the context object.

```ts title="plugin.ts"
import { createAuthMiddleware } from "better-auth/plugins";
import { sessionMiddleware } from "better-auth/api";

const myPlugin = ()=>{
    return {
        id: "my-plugin",
        endpoints: {
            getHelloWorld: createAuthEndpoint("/my-plugin/hello-world", {
                method: "GET",
                use: [sessionMiddleware], // [!code highlight]
            }, async(ctx) => {
                const session = ctx.context.session;
                return ctx.json({
                    message: "Hello World"
                })
            })
        }
    } satisfies BetterAuthPlugin
}
```

## Creating a client plugin

If your endpoints needs to be called from the client, you'll need to also create a client plugin. Better Auth clients can infer the endpoints from the server plugins. You can also add additional client side logic.

```ts title="client-plugin.ts"
import type { BetterAuthClientPlugin } from "better-auth";

export const myPluginClient = ()=>{
    return {
        id: "my-plugin",
    } satisfies BetterAuthClientPlugin
}
```

### Endpoint Interface

Endpoints are inferred from the server plugin by adding a `$InferServerPlugin` key to the client plugin.

The client infers the `path` as an object and converts kebab-case to camelCase. For example, `/my-plugin/hello-world` becomes `myPlugin.helloWorld`.

```ts title="client-plugin.ts"
import type { BetterAuthClientPlugin } from "better-auth/client";
import type { myPlugin } from "./plugin";

const myPluginClient = ()=> {
    return  {
        id: "my-plugin",
        $InferServerPlugin: {} as ReturnType<typeof myPlugin>,
    } satisfies BetterAuthClientPlugin
}
```

### Get actions

If you need to add additional methods or what not to the client you can use the `getActions` function. This function is called with the `fetch` function from the client.

Better Auth uses <Link href="https://better-fetch.vercel.app"> Better fetch </Link> to make requests. Better fetch is a simple fetch wrapper made by the same author of Better Auth.

```ts title="client-plugin.ts"
import type { BetterAuthClientPlugin } from "better-auth/client";
import type { myPlugin } from "./plugin";
import type { BetterFetchOption } from "@better-fetch/fetch";

const myPluginClient = {
    id: "my-plugin",
    $InferServerPlugin: {} as ReturnType<typeof myPlugin>,
    getActions: ($fetch)=>{
        return {
            myCustomAction: async (data: {
                foo: string,
            }, fetchOptions?: BetterFetchOption)=>{
                const res = $fetch("/custom/action", {
                    method: "POST",
                    body: {
                        foo: data.foo
                    },
                    ...fetchOptions
                })
                return res
            }
        }
    }
} satisfies BetterAuthClientPlugin
```

<Callout>
  As a general guideline, ensure that each function accepts only one argument, with an optional second argument for fetchOptions to allow users to pass additional options to the fetch call. The function should return an object containing data and error keys.

  If your use case involves actions beyond API calls, feel free to deviate from this rule.
</Callout>

### Get Atoms

This is only useful if you want to provide `hooks` like `useSession`.

Get atoms is called with the `fetch` function from better fetch and it should return an object with the atoms. The atoms should be created using <Link href="https://github.com/nanostores/nanostores">nanostores</Link>. The atoms will be resolved by each framework `useStore` hook provided by nanostores.

```ts title="client-plugin.ts"
import { atom } from "nanostores";
import type { BetterAuthClientPlugin } from "better-auth/client";

const myPluginClient = {
    id: "my-plugin",
    $InferServerPlugin: {} as ReturnType<typeof myPlugin>,
    getAtoms: ($fetch)=>{
        const myAtom = atom<null>()
        return {
            myAtom
        }
    }
} satisfies BetterAuthClientPlugin
```

See built-in plugins for examples of how to use atoms properly.

### Path methods

By default, inferred paths use `GET` method if they don't require a body and `POST` if they do. You can override this by passing a `pathMethods` object. The key should be the path and the value should be the method ("POST" | "GET").

```ts title="client-plugin.ts"
import type { BetterAuthClientPlugin } from "better-auth/client";
import type { myPlugin } from "./plugin";

const myPluginClient = {
    id: "my-plugin",
    $InferServerPlugin: {} as ReturnType<typeof myPlugin>,
    pathMethods: {
        "/my-plugin/hello-world": "POST"
    }
} satisfies BetterAuthClientPlugin
```

### Fetch plugins

If you need to use better fetch plugins you can pass them to the `fetchPlugins` array. You can read more about better fetch plugins in the <Link href="https://better-fetch.vercel.app/docs/plugins">better fetch documentation</Link>.

### Atom Listeners

This is only useful if you want to provide `hooks` like `useSession` and you want to listen to atoms and re-evaluate them when they change.

You can see how this is used in the built-in plugins.

# concepts: OAuth
URL: /docs/concepts/oauth
Source: https://raw.githubusercontent.com/better-auth/better-auth/refs/heads/main/docs/content/docs/concepts/oauth.mdx

How Better Auth handles OAuth
        
***

title: OAuth
description: How Better Auth handles OAuth
------------------------------------------

Better Auth comes with built-in support for OAuth 2.0 and OpenID Connect. This allows you to authenticate users via popular OAuth providers like Google, Facebook, GitHub, and more.

If your desired provider isn't directly supported, you can use the [Generic OAuth Plugin](/docs/plugins/generic-oauth) for custom integrations.

## Configuring Social Providers

To enable a social provider, you need to provide `clientId` and `clientSecret` for the provider.

Here's an example of how to configure Google as a provider:

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
    },
  },
});
```

## Usage

### Sign In

To sign in with a social provider, you can use the `signIn.social` function with the `authClient` or `auth.api` for server-side usage.

```ts
// client-side usage
await authClient.signIn.social({
  provider: "google", // or any other provider id
})
```

```ts
// server-side usage
await auth.api.signInSocial({
  body: {
    provider: "google", // or any other provider id
  },
});
```

### Link account

To link an account to a social provider, you can use the `linkAccount` function with the `authClient` or `auth.api` for server-side usage.

```ts
await authClient.linkSocial({
  provider: "google", // or any other provider id
})
```

server-side usage:

```ts
await auth.api.linkSocialAccount({
  body: {
    provider: "google", // or any other provider id
  },
  headers: // pass headers with authenticated token
});
```

### Get Access Token

To get the access token for a social provider, you can use the `getAccessToken` function with the `authClient` or `auth.api` for server-side usage. When you use this endpoint, if the access token is expired, it will be refreshed.

```ts
const { accessToken } = await authClient.getAccessToken({
  providerId: "google", // or any other provider id
  accountId: "accountId", // optional, if you want to get the access token for a specific account
})
```

server-side usage:

```ts
await auth.api.getAccessToken({
  body: {
    providerId: "google", // or any other provider id
    accountId: "accountId", // optional, if you want to get the access token for a specific account
    userId: "userId", // optional, if you don't provide headers with authenticated token
  },
  headers: // pass headers with authenticated token
});
```

### Get Account Info Provided by the provider

To get provider specific account info you can use the `accountInfo` function with the `authClient` or `auth.api` for server-side usage.

```ts
const info = await authClient.accountInfo({
  accountId: "accountId", // here you pass in the provider given account id, the provider is automatically detected from the account id
})
```

server-side usage:

```ts
await auth.api.accountInfo({
  body: { accountId: "accountId" },
  headers: // pass headers with authenticated token
});
```

### Requesting Additional Scopes

Sometimes your application may need additional OAuth scopes after the user has already signed up (e.g., for accessing GitHub repositories or Google Drive). Users may not want to grant extensive permissions initially, preferring to start with minimal permissions and grant additional access as needed.

You can request additional scopes by using the `linkSocial` method with the same provider. This will trigger a new OAuth flow that requests the additional scopes while maintaining the existing account connection.

```ts
const requestAdditionalScopes = async () => {
    await authClient.linkSocial({
        provider: "google",
        scopes: ["https://www.googleapis.com/auth/drive.file"],
    });
};
```

<Callout>
  Make sure you're running Better Auth version 1.2.7 or later. Earlier versions (like 1.2.2) may show a "Social account already linked" error when trying to link with an existing provider for additional scopes.
</Callout>

## Provider Options

### scope

The scope of the access request. For example, `email` or `profile`.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      scope: ["email", "profile"],
    },
  },
});
```

### redirectURI

Custom redirect URI for the provider. By default, it uses `/api/auth/callback/${providerName}`

```ts title="auth.ts"

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      redirectURI: "https://your-app.com/auth/callback",
    },
  },
});
```

### disableSignUp

Disables sign-up for new users.

### disableIdTokenSignIn

Disables the use of the ID token for sign-in. By default, it's enabled for some providers like Google and Apple.

### verifyIdToken

A custom function to verify the ID token.

### overrideUserInfoOnSignIn

A boolean value that determines whether to override the user information in the database when signing in. By default, it is set to `false`, meaning that the user information will not be overridden during sign-in. If you want to update the user information every time they sign in, set this to `true`.

### mapProfileToUser

A custom function to map the user profile returned from the provider to the user object in your database.

Useful, if you have additional fields in your user object you want to populate from the provider's profile. Or if you want to change how by default the user object is mapped.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      mapProfileToUser: (profile) => {
        return {
          firstName: profile.given_name,
          lastName: profile.family_name,
        };
      },
    },
  },
});
```

### refreshAccessToken

A custom function to refresh the token. This feature is only supported for built-in social providers (Google, Facebook, GitHub, etc.) and is not currently supported for custom OAuth providers configured through the Generic OAuth Plugin. For built-in providers, you can provide a custom function to refresh the token if needed.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      refreshAccessToken: async (token) => {
        return {
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
        };
      },
    },
  },
});
```

### clientKey

The client key of your application. This is used by TikTok Social Provider instead of `clientId`.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    tiktok: {
      clientKey: "YOUR_TIKTOK_CLIENT_KEY",
      clientSecret: "YOUR_TIKTOK_CLIENT_SECRET",
    },
  },
});
```

### getUserInfo

A custom function to get user info from the provider. This allows you to override the default user info retrieval process.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      getUserInfo: async (token) => {
        // Custom implementation to get user info
        const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
          },
        });
        const profile = await response.json();
        return {
          user: {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            image: profile.picture,
            emailVerified: profile.verified_email,
          },
          data: profile,
        };
      },
    },
  },
});
```

### disableImplicitSignUp

Disables implicit sign up for new users. When set to true for the provider, sign-in needs to be called with `requestSignUp` as true to create new users.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      disableImplicitSignUp: true,
    },
  },
});
```

### prompt

The prompt to use for the authorization code request. This controls the authentication flow behavior.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      prompt: "select_account", // or "consent", "login", "none", "select_account+consent"
    },
  },
});
```

### responseMode

The response mode to use for the authorization code request. This determines how the authorization response is returned.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      responseMode: "query", // or "form_post"
    },
  },
});
```

### disableDefaultScope

Removes the default scopes of the provider. By default, providers include certain scopes like `email` and `profile`. Set this to `true` to remove these default scopes and use only the scopes you specify.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      disableDefaultScope: true,
      scope: ["https://www.googleapis.com/auth/userinfo.email"], // Only this scope will be used
    },
  },
});
```

### Other Provider Configurations

Each provider may have additional options, check the specific provider documentation for more details.

# concepts: Rate Limit
URL: /docs/concepts/rate-limit
Source: https://raw.githubusercontent.com/better-auth/better-auth/refs/heads/main/docs/content/docs/concepts/rate-limit.mdx

How to limit the number of requests a user can make to the server in a given time period.
        
***

title: Rate Limit
description: How to limit the number of requests a user can make to the server in a given time period.
------------------------------------------------------------------------------------------------------

Better Auth includes a built-in rate limiter to help manage traffic and prevent abuse. By default, in production mode, the rate limiter is set to:

* Window: 60 seconds
* Max Requests: 100 requests

<Callout type="warning">
  Server-side requests made using `auth.api` aren't affected by rate limiting. Rate limits only apply to client-initiated requests.
</Callout>

You can easily customize these settings by passing the rateLimit object to the betterAuth function.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
    rateLimit: {
        window: 10, // time window in seconds
        max: 100, // max requests in the window
    },
})
```

Rate limiting is disabled in development mode by default. In order to enable it, set `enabled` to `true`:

```ts title="auth.ts"
export const auth = betterAuth({
    rateLimit: {
        enabled: true,
        //...other options
    },
})
```

In addition to the default settings, Better Auth provides custom rules for specific paths. For example:

* `/sign-in/email`: Is limited to 3 requests within 10 seconds.

In addition, plugins also define custom rules for specific paths. For example, `twoFactor` plugin has custom rules:

* `/two-factor/verify`: Is limited to 3 requests within 10 seconds.

These custom rules ensure that sensitive operations are protected with stricter limits.

## Configuring Rate Limit

### Connecting IP Address

Rate limiting uses the connecting IP address to track the number of requests made by a user. The
default header checked is `x-forwarded-for`, which is commonly used in production environments. If
you are using a different header to track the user's IP address, you'll need to specify it.

```ts title="auth.ts" 
export const auth = betterAuth({
    //...other options
    advanced: {
        ipAddress: {
          ipAddressHeaders: ["cf-connecting-ip"], // Cloudflare specific header example
      },
    },
    rateLimit: {
        enabled: true,
        window: 60, // time window in seconds
        max: 100, // max requests in the window
    },
})
```

### Rate Limit Window

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
    //...other options
    rateLimit: {
        window: 60, // time window in seconds
        max: 100, // max requests in the window
    },
})
```

You can also pass custom rules for specific paths.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
    //...other options
    rateLimit: {
        window: 60, // time window in seconds
        max: 100, // max requests in the window
        customRules: {
            "/sign-in/email": {
                window: 10,
                max: 3,
            },
            "/two-factor/*": async (request)=> {
                // custom function to return rate limit window and max
                return {
                    window: 10,
                    max: 3,
                }
            }
        },
    },
})
```

If you like to disable rate limiting for a specific path, you can set it to `false` or return `false` from the custom rule function.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
    //...other options
    rateLimit: {
        customRules: {
            "/get-session": false,
        },
    },
})
```

### Storage

By default, rate limit data is stored in memory, which may not be suitable for many use cases, particularly in serverless environments. To address this, you can use a database, secondary storage, or custom storage for storing rate limit data.

**Using Database**

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
    //...other options
    rateLimit: {
        storage: "database",
        modelName: "rateLimit", //optional by default "rateLimit" is used
    },
})
```

Make sure to run `migrate` to create the rate limit table in your database.

```bash
npx @better-auth/cli migrate
```

**Using Secondary Storage**

If a [Secondary Storage](/docs/concepts/database#secondary-storage) has been configured you can use that to store rate limit data.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
    //...other options
    rateLimit: {
		storage: "secondary-storage"
    },
})
```

**Custom Storage**

If none of the above solutions suits your use case you can implement a `customStorage`.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
    //...other options
    rateLimit: {
        customStorage: {
            get: async (key) => {
                // get rate limit data
            },
            set: async (key, value) => {
                // set rate limit data
            },
        },
    },
})
```

## Handling Rate Limit Errors

When a request exceeds the rate limit, Better Auth returns the following header:

* `X-Retry-After`: The number of seconds until the user can make another request.

To handle rate limit errors on the client side, you can manage them either globally or on a per-request basis. Since Better Auth clients wrap over Better Fetch, you can pass `fetchOptions` to handle rate limit errors

**Global Handling**

```ts title="auth-client.ts"
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
    fetchOptions: {
        onError: async (context) => {
            const { response } = context;
            if (response.status === 429) {
                const retryAfter = response.headers.get("X-Retry-After");
                console.log(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
            }
        },
    }
})
```

**Per Request Handling**

```ts title="auth-client.ts"
import { authClient } from "./auth-client";

await authClient.signIn.email({
    fetchOptions: {
        onError: async (context) => {
            const { response } = context;
            if (response.status === 429) {
                const retryAfter = response.headers.get("X-Retry-After");
                console.log(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
            }
        },
    }
})
```

### Schema

If you are using a database to store rate limit data you need this schema:

Table Name: `rateLimit`

<DatabaseTable
  fields={[
      { 
      name: "id", 
      type: "string", 
      description: "Database ID",
      isPrimaryKey: true
      },
      { 
      name: "key", 
      type: "string", 
      description: "Unique identifier for each rate limit key",
      },
      { 
      name: "count", 
      type: "integer", 
      description: "Time window in seconds" 
      },
      { 
      name: "lastRequest", 
      type: "bigint", 
      description: "Max requests in the window" 
      }]}
/>
# concepts: Session Management
URL: /docs/concepts/session-management
Source: https://raw.githubusercontent.com/better-auth/better-auth/refs/heads/main/docs/content/docs/concepts/session-management.mdx

Better Auth session management.
        
***

title: Session Management
description: Better Auth session management.
--------------------------------------------

Better Auth manages session using a traditional cookie-based session management. The session is stored in a cookie and is sent to the server on every request. The server then verifies the session and returns the user data if the session is valid.

## Session table

The session table stores the session data. The session table has the following fields:

* `id`: The session token. Which is also used as the session cookie.
* `userId`: The user ID of the user.
* `expiresAt`: The expiration date of the session.
* `ipAddress`: The IP address of the user.
* `userAgent`: The user agent of the user. It stores the user agent header from the request.

## Session Expiration

The session expires after 7 days by default. But whenever the session is used and the `updateAge` is reached, the session expiration is updated to the current time plus the `expiresIn` value.

You can change both the `expiresIn` and `updateAge` values by passing the `session` object to the `auth` configuration.

```ts title="auth.ts"
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    //... other config options
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24 // 1 day (every 1 day the session expiration is updated)
    }
})
```

### Disable Session Refresh

You can disable session refresh so that the session is not updated regardless of the `updateAge` option.

```ts title="auth.ts"
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    //... other config options
    session: {
        disableSessionRefresh: true
    }
})
```

## Session Freshness

Some endpoints in Better Auth require the session to be **fresh**. A session is considered fresh if its `createdAt` is within the `freshAge` limit. By default, the `freshAge` is set to **1 day** (60 \* 60 \* 24).

You can customize the `freshAge` value by passing a `session` object in the `auth` configuration:

```ts title="auth.ts"
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    //... other config options
    session: {
        freshAge: 60 * 5 // 5 minutes (the session is fresh if created within the last 5 minutes)
    }
})
```

To **disable the freshness check**, set `freshAge` to `0`:

```ts title="auth.ts"
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    //... other config options
    session: {
        freshAge: 0 // Disable freshness check
    }
})
```

## Session Management

Better Auth provides a set of functions to manage sessions.

### Get Session

The `getSession` function retrieves the current active session.

```ts client="client.ts"
import { authClient } from "@/lib/client"

const { data: session } = await authClient.getSession()
```

To learn how to customize the session response check the [Customizing Session Response](#customizing-session-response) section.

### Use Session

The `useSession` action provides a reactive way to access the current session.

```ts client="client.ts"
import { authClient } from "@/lib/client"

const { data: session } = authClient.useSession()
```

### List Sessions

The `listSessions` function returns a list of sessions that are active for the user.

```ts title="auth-client.ts"
import { authClient } from "@/lib/client"

const sessions = await authClient.listSessions()
```

### Revoke Session

When a user signs out of a device, the session is automatically ended. However, you can also end a session manually from any device the user is signed into.

To end a session, use the `revokeSession` function. Just pass the session token as a parameter.

```ts title="auth-client.ts"
await authClient.revokeSession({
    token: "session-token"
})
```

### Revoke Other Sessions

To revoke all other sessions except the current session, you can use the `revokeOtherSessions` function.

```ts title="auth-client.ts"
await authClient.revokeOtherSessions()
```

### Revoke All Sessions

To revoke all sessions, you can use the `revokeSessions` function.

```ts title="auth-client.ts"
await authClient.revokeSessions()
```

### Revoking Sessions on Password Change

You can revoke all sessions when the user changes their password by passing `revokeOtherSessions` as true on `changePassword` function.

```ts title="auth.ts"
await authClient.changePassword({
    newPassword: newPassword,
    currentPassword: currentPassword,
    revokeOtherSessions: true,
})
```

## Session Caching

### Cookie Cache

Calling your database every time `useSession` or `getSession` invoked isn’t ideal, especially if sessions don’t change frequently. Cookie caching handles this by storing session data in a short-lived, signed cookie—similar to how JWT access tokens are used with refresh tokens.

When cookie caching is enabled, the server can check session validity from the cookie itself instead of hitting the database each time. The cookie is signed to prevent tampering, and a short `maxAge` ensures that the session data gets refreshed regularly. If a session is revoked or expires, the cookie will be invalidated automatically.

To turn on cookie caching, just set `session.cookieCache` in your auth config:

```ts title="auth.ts"
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60 // Cache duration in seconds
        }
    }
});
```

If you want to disable returning from the cookie cache when fetching the session, you can pass `disableCookieCache:true` this will force the server to fetch the session from the database and also refresh the cookie cache.

```ts title="auth-client.ts"
const session = await authClient.getSession({ query: {
    disableCookieCache: true
}})
```

or on the server

```ts title="server.ts"
await auth.api.getSession({
    query: {
        disableCookieCache: true,
    }, 
    headers: req.headers, // pass the headers
});
```

## Customizing Session Response

When you call `getSession` or `useSession`, the session data is returned as a `user` and `session` object. You can customize this response using the `customSession` plugin.

```ts title="auth.ts"
import { customSession } from "better-auth/plugins";

export const auth = betterAuth({
    plugins: [
        customSession(async ({ user, session }) => {
            const roles = findUserRoles(session.session.userId);
            return {
                roles,
                user: {
                    ...user,
                    newField: "newField",
                },
                session
            };
        }),
    ],
});
```

This will add `roles` and `user.newField` to the session response.

**Infer on the Client**

```ts title="auth-client.ts"
import { customSessionClient } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth"; // Import the auth instance as a type

const authClient = createAuthClient({
    plugins: [customSessionClient<typeof auth>()],
});

const { data } = authClient.useSession();
const { data: sessionData } = await authClient.getSession();
// data.roles
// data.user.newField
```

### Caveats on Customizing Session Response

1. The passed `session` object to the callback does not infer fields added by plugins.

However, as a workaround, you can pull up your auth options and pass it to the plugin to infer the fields.

```ts
import { betterAuth, BetterAuthOptions } from "better-auth";

const options = {
  //...config options
  plugins: [
    //...plugins 
  ]
} satisfies BetterAuthOptions;

export const auth = betterAuth({
    ...options,
    plugins: [
        ...(options.plugins ?? []),
        customSession(async ({ user, session }, ctx) => {
            // now both user and session will infer the fields added by plugins and your custom fields
            return {
                user,
                session
            }
        }, options), // pass options here  // [!code highlight]
    ]
})
```

2. When your server and client code are in separate projects or repositories, and you cannot import the `auth` instance as a type reference, type inference for custom session fields will not work on the client side.
3. Session caching, including secondary storage or cookie cache, does not include custom fields. Each time the session is fetched, your custom session function will be called.

**Mutating the list-device-sessions endpoint**
The `/multi-session/list-device-sessions` endpoint from the [multi-session](/docs/plugins/multi-session) plugin is used to list the devices that the user is signed into.

You can mutate the response of this endpoint by passing the `shouldMutateListDeviceSessionsEndpoint` option to the `customSession` plugin.

By default, we do not mutate the response of this endpoint.

```ts title="auth.ts"
import { customSession } from "better-auth/plugins";

export const auth = betterAuth({
    plugins: [
        customSession(async ({ user, session }, ctx) => {
            return {
                user,
                session
            }
        }, {}, { shouldMutateListDeviceSessionsEndpoint: true }), // [!code highlight]
    ],
});
```

# concepts: TypeScript
URL: /docs/concepts/typescript
Source: https://raw.githubusercontent.com/better-auth/better-auth/refs/heads/main/docs/content/docs/concepts/typescript.mdx

Better Auth TypeScript integration.
        
***

title: TypeScript
description: Better Auth TypeScript integration.
------------------------------------------------

Better Auth is designed to be type-safe. Both the client and server are built with TypeScript, allowing you to easily infer types.

## TypeScript Config

### Strict Mode

Better Auth is designed to work with TypeScript's strict mode. We recommend enabling strict mode in your TypeScript config file:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "strict": true
  }
}
```

if you can't set `strict` to `true`, you can enable `strictNullChecks`:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "strictNullChecks": true,
  }
}
```

<Callout type="warn">
  If you're running into issues with TypeScript inference exceeding maximum length the compiler will serialize,
  then please make sure you're following the instructions above, as well as ensuring that both `declaration` and `composite` are not enabled.
</Callout>

## Inferring Types

Both the client SDK and the server offer types that can be inferred using the `$Infer` property. Plugins can extend base types like `User` and `Session`, and you can use `$Infer` to infer these types. Additionally, plugins can provide extra types that can also be inferred through `$Infer`.

```ts title="auth-client.ts" 
import { createAuthClient } from "better-auth/client"

const authClient = createAuthClient()

export type Session = typeof authClient.$Infer.Session
```

The `Session` type includes both `session` and `user` properties. The user property represents the user object type, and the `session` property represents the `session` object type.

You can also infer types on the server side.

```ts title="auth.ts" 
import { betterAuth } from "better-auth"
import Database from "better-sqlite3"

export const auth = betterAuth({
    database: new Database("database.db")
})

type Session = typeof auth.$Infer.Session
```

## Additional Fields

Better Auth allows you to add additional fields to the user and session objects. All additional fields are properly inferred and available on the server and client side.

```ts
import { betterAuth } from "better-auth"
import Database from "better-sqlite3"

export const auth = betterAuth({
    database: new Database("database.db"),
    user: {
       additionalFields: {
          role: {
              type: "string",
              input: false
            } 
        }
    }
   
})

type Session = typeof auth.$Infer.Session
```

In the example above, we added a `role` field to the user object. This field is now available on the `Session` type.

### The `input` property

The `input` property in an additional field configuration determines whether the field should be included in the user input. This property defaults to `true`, meaning the field will be part of the user input during operations like registration.

To prevent a field from being part of the user input, you must explicitly set `input: false`:

```ts
additionalFields: {
    role: {
        type: "string",
        input: false
    }
}
```

When `input` is set to `false`, the field will be excluded from user input, preventing users from passing a value for it.

By default, additional fields are included in the user input, which can lead to security vulnerabilities if not handled carefully. For fields that should not be set by the user, like a `role`, it is crucial to set `input: false` in the configuration.

### Inferring Additional Fields on Client

To make sure proper type inference for additional fields on the client side, you need to inform the client about these fields. There are two approaches to achieve this, depending on your project structure:

1. For Monorepo or Single-Project Setups

If your server and client code reside in the same project, you can use the `inferAdditionalFields` plugin to automatically infer the additional fields from your server configuration.

```ts
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
```

2. For Separate Client-Server Projects

If your client and server are in separate projects, you'll need to manually specify the additional fields when creating the auth client.

```ts
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields({
      user: {
        role: {
          type: "string"
        }
      }
  })],
});
```

# concepts: User & Accounts
URL: /docs/concepts/users-accounts
Source: https://raw.githubusercontent.com/better-auth/better-auth/refs/heads/main/docs/content/docs/concepts/users-accounts.mdx

User and account management.
        
***

title: User & Accounts
description: User and account management.
-----------------------------------------

Beyond authenticating users, Better Auth also provides a set of methods to manage users. This includes, updating user information, changing passwords, and more.

The user table stores the authentication data of the user [Click here to view the schema](/docs/concepts/database#user).

The user table can be extended using [additional fields](/docs/concepts/database#extending-core-schema) or by plugins to store additional data.

## Update User

### Update User Information

To update user information, you can use the `updateUser` function provided by the client. The `updateUser` function takes an object with the following properties:

```ts
await authClient.updateUser({
    image: "https://example.com/image.jpg",
    name: "John Doe",
})
```

### Change Email

To allow users to change their email, first enable the `changeEmail` feature, which is disabled by default. Set `changeEmail.enabled` to `true`:

```ts
export const auth = betterAuth({
    user: {
        changeEmail: {
            enabled: true,
        }
    }
})
```

For users with a verified email, provide the `sendChangeEmailVerification` function. This function triggers when a user changes their email, sending a verification email with a URL and token. If the current email isn't verified, the change happens immediately without verification.

```ts
export const auth = betterAuth({
    user: {
        changeEmail: {
            enabled: true,
            sendChangeEmailVerification: async ({ user, newEmail, url, token }, request) => {
                await sendEmail({
                    to: user.email, // verification email must be sent to the current user email to approve the change
                    subject: 'Approve email change',
                    text: `Click the link to approve the change: ${url}`
                })
            }
        }
    }
})
```

Once enabled, use the `changeEmail` function on the client to update a user’s email. The user must verify their current email before changing it.

```ts
await authClient.changeEmail({
    newEmail: "new-email@email.com",
    callbackURL: "/dashboard", //to redirect after verification
});
```

After verification, the new email is updated in the user table, and a confirmation is sent to the new address.

<Callout type="warn">
  If the current email is unverified, the new email is updated without the verification step.
</Callout>

### Change Password

A user's password isn't stored in the user table. Instead, it's stored in the account table. To change the password of a user, you can use one of the following approaches:

### Client Side

```ts
const { data, error } = await authClient.changePassword({
    newPassword: newpassword1234,
    currentPassword: oldpassword1234,
    revokeOtherSessions, // required
});
```

### Server Side

```ts
const data = await auth.api.changePassword({
    body: {
        newPassword: newpassword1234,
        currentPassword: oldpassword1234,
        revokeOtherSessions, // required
    },
    // This endpoint requires session cookies.
    headers: await headers()
});
```

### Type Definition

```ts
type changePassword = {
    /**
     * The new password to set 
     */
    newPassword: string = "newpassword1234"
    /**
     * The current user password 
     */
    currentPassword: string = "oldpassword1234"
    /**
     * When set to true, all other active sessions for this user will be invalidated
     */
    revokeOtherSessions?: boolean = true

}
```

### Set Password

If a user was registered using OAuth or other providers, they won't have a password or a credential account. In this case, you can use the `setPassword` action to set a password for the user. For security reasons, this function can only be called from the server. We recommend having users go through a 'forgot password' flow to set a password for their account.

```ts
await auth.api.setPassword({
    body: { newPassword: "password" },
    headers: // headers containing the user's session token
});
```

## Delete User

Better Auth provides a utility to hard delete a user from your database. It's disabled by default, but you can enable it easily by passing `enabled:true`

```ts
export const auth = betterAuth({
    //...other config
    user: {
        deleteUser: { // [!code highlight]
            enabled: true // [!code highlight]
        } // [!code highlight]
    }
})
```

Once enabled, you can call `authClient.deleteUser` to permanently delete user data from your database.

### Adding Verification Before Deletion

For added security, you’ll likely want to confirm the user’s intent before deleting their account. A common approach is to send a verification email. Better Auth provides a `sendDeleteAccountVerification` utility for this purpose.
This is especially needed if you have OAuth setup and want them to be able to delete their account without forcing them to login again for a fresh session.

Here’s how you can set it up:

```ts
export const auth = betterAuth({
    user: {
        deleteUser: {
            enabled: true,
            sendDeleteAccountVerification: async (
                {
                    user,   // The user object
                    url, // The auto-generated URL for deletion
                    token  // The verification token  (can be used to generate custom URL)
                },
                request  // The original request object (optional)
            ) => {
                // Your email sending logic here
                // Example: sendEmail(data.user.email, "Verify Deletion", data.url);
            },
        },
    },
});
```

**How callback verification works:**

* **Callback URL**: The URL provided in `sendDeleteAccountVerification` is a pre-generated link that deletes the user data when accessed.

```ts title="delete-user.ts"
await authClient.deleteUser({
    callbackURL: "/goodbye" // you can provide a callback URL to redirect after deletion
});
```

* **Authentication Check**: The user must be signed in to the account they’re attempting to delete.
  If they aren’t signed in, the deletion process will fail.

If you have sent a custom URL, you can use the `deleteUser` method with the token to delete the user.

```ts title="delete-user.ts"
await authClient.deleteUser({
    token
});
```

### Authentication Requirements

To delete a user, the user must meet one of the following requirements:

1. A valid password

if the user has a password, they can delete their account by providing the password.

```ts title="delete-user.ts"
await authClient.deleteUser({
    password: "password"
});
```

2. Fresh session

The user must have a `fresh` session token, meaning the user must have signed in recently. This is checked if the password is not provided.

<Callout type="warn">
  By default `session.freshAge` is set to `60 * 60 * 24` (1 day). You can change this value by passing the `session` object to the `auth` configuration. If it is set to `0`, the freshness check is disabled. It is recommended not to disable this check if you are not using email verification for deleting the account.
</Callout>

```ts title="delete-user.ts"
await authClient.deleteUser();
```

3. Enabled email verification (needed for OAuth users)

As OAuth users don't have a password, we need to send a verification email to confirm the user's intent to delete their account. If you have already added the `sendDeleteAccountVerification` callback, you can just call the `deleteUser` method without providing any other information.

```ts title="delete-user.ts"
await authClient.deleteUser();
```

4. If you have a custom delete account page and sent that url via the `sendDeleteAccountVerification` callback.
   Then you need to call the `deleteUser` method with the token to complete the deletion.

```ts title="delete-user.ts"
await authClient.deleteUser({
    token
});
```

### Callbacks

**beforeDelete**: This callback is called before the user is deleted. You can use this callback to perform any cleanup or additional checks before deleting the user.

```ts title="auth.ts"
export const auth = betterAuth({
    user: {
        deleteUser: {
            enabled: true,
            beforeDelete: async (user) => {
                // Perform any cleanup or additional checks here
            },
        },
    },
});
```

you can also throw `APIError` to interrupt the deletion process.

```ts title="auth.ts"
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";

export const auth = betterAuth({
    user: {
        deleteUser: {
            enabled: true,
            beforeDelete: async (user, request) => {
                if (user.email.includes("admin")) {
                    throw new APIError("BAD_REQUEST", {
                        message: "Admin accounts can't be deleted",
                    });
                }
            },
        },
    },
});
```

**afterDelete**: This callback is called after the user is deleted. You can use this callback to perform any cleanup or additional actions after the user is deleted.

```ts title="auth.ts"
export const auth = betterAuth({
    user: {
        deleteUser: {
            enabled: true,
            afterDelete: async (user, request) => {
                // Perform any cleanup or additional actions here
            },
        },
    },
});
```

## Accounts

Better Auth supports multiple authentication methods. Each authentication method is called a provider. For example, email and password authentication is a provider, Google authentication is a provider, etc.

When a user signs in using a provider, an account is created for the user. The account stores the authentication data returned by the provider. This data includes the access token, refresh token, and other information returned by the provider.

The account table stores the authentication data of the user [Click here to view the schema](/docs/concepts/database#account)

### List User Accounts

To list user accounts you can use `client.user.listAccounts` method. Which will return all accounts associated with a user.

```ts
const accounts = await authClient.listAccounts();
```

### Token Encryption

Better Auth doesn’t encrypt tokens by default and that’s intentional. We want you to have full control over how encryption and decryption are handled, rather than baking in behavior that could be confusing or limiting. If you need to store encrypted tokens (like accessToken or refreshToken), you can use databaseHooks to encrypt them before they’re saved to your database.

```ts
export const auth = betterAuth({
    databaseHooks: {
        account: {
            create: {
                before(account, context) {
                    const withEncryptedTokens = { ...account };
                    if (account.accessToken) {
                        const encryptedAccessToken = encrypt(account.accessToken)  // [!code highlight]
                        withEncryptedTokens.accessToken = encryptedAccessToken;
                    }
                    if (account.refreshToken) {
                        const encryptedRefreshToken = encrypt(account.refreshToken); // [!code highlight]
                        withEncryptedTokens.refreshToken = encryptedRefreshToken;
                    }
                    return {
                        data: withEncryptedTokens
                    }
                },
            }
        }
    }
})
```

Then whenever you retrieve back the account make sure to decrypt the tokens before using them.

### Account Linking

Account linking enables users to associate multiple authentication methods with a single account. With Better Auth, users can connect additional social sign-ons or OAuth providers to their existing accounts if the provider confirms the user's email as verified.

If account linking is disabled, no accounts can be linked, regardless of the provider or email verification status.

```ts title="auth.ts"
export const auth = betterAuth({
    account: {
        accountLinking: {
            enabled: true, 
        }
    },
});
```

#### Forced Linking

You can specify a list of "trusted providers." When a user logs in using a trusted provider, their account will be automatically linked even if the provider doesn’t confirm the email verification status. Use this with caution as it may increase the risk of account takeover.

```ts title="auth.ts"
export const auth = betterAuth({
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ["google", "github"]
        }
    },
});
```

#### Manually Linking Accounts

Users already signed in can manually link their account to additional social providers or credential-based accounts.

* **Linking Social Accounts:** Use the `linkSocial` method on the client to link a social provider to the user's account.

  ```ts
  await authClient.linkSocial({
      provider: "google", // Provider to link
      callbackURL: "/callback" // Callback URL after linking completes
  });
  ```

  You can also request specific scopes when linking a social account, which can be different from the scopes used during the initial authentication:

  ```ts
  await authClient.linkSocial({
      provider: "google",
      callbackURL: "/callback",
      scopes: ["https://www.googleapis.com/auth/drive.readonly"] // Request additional scopes
  });
  ```

  You can also link accounts using ID tokens directly, without redirecting to the provider's OAuth flow:

  ```ts
  await authClient.linkSocial({
      provider: "google",
      idToken: {
          token: "id_token_from_provider",
          nonce: "nonce_used_for_token", // Optional
          accessToken: "access_token", // Optional, may be required by some providers
          refreshToken: "refresh_token" // Optional
      }
  });
  ```

  This is useful when you already have valid tokens from the provider, for example:

  * After signing in with a native SDK
  * When using a mobile app that handles authentication
  * When implementing custom OAuth flows

  The ID token must be valid and the provider must support ID token verification.

  If you want your users to be able to link a social account with a different email address than the user, or if you want to use a provider that does not return email addresses, you will need to enable this in the account linking settings.

  ```ts title="auth.ts"
  export const auth = betterAuth({
      account: {
          accountLinking: {
              allowDifferentEmails: true
          }
      },
  });
  ```

  If you want the newly linked accounts to update the user information, you need to enable this in the account linking settings.

  ```ts title="auth.ts"
  export const auth = betterAuth({
      account: {
          accountLinking: {
              updateUserInfoOnLink: true
          }
      },
  });
  ```

* **Linking Credential-Based Accounts:** To link a credential-based account (e.g., email and password), users can initiate a "forgot password" flow, or you can call the `setPassword` method on the server.

  ```ts
  await auth.api.setPassword({
      headers: /* headers containing the user's session token */,
      password: /* new password */
  });
  ```

<Callout>
  `setPassword` can't be called from the client for security reasons.
</Callout>

### Account Unlinking

You can unlink a user account by providing a `providerId`.

```ts
await authClient.unlinkAccount({
    providerId: "google"
});

// Unlink a specific account
await authClient.unlinkAccount({
    providerId: "google",
    accountId: "123"
});
```

If the account doesn't exist, it will throw an error. Additionally, if the user only has one account, unlinking will be prevented to stop account lockout (unless `allowUnlinkingAll` is set to `true`).

```ts title="auth.ts"
export const auth = betterAuth({
    account: {
        accountLinking: {
            allowUnlinkingAll: true
        }
    },
});
```




