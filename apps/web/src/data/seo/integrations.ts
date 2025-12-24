export type Integration = {
	slug: string;
	title: string;
	description: string;
	metaDescription: string;
	icon: string;
	installCommand: string;
	setupSteps: string[];
	exampleCode: string;
	features: string[];
};

export const integrations: Integration[] = [
	{
		slug: "node",
		title: "Node.js",
		description:
			"Use Mockspec with Node.js to mock APIs in your backend applications, scripts, and serverless functions.",
		metaDescription:
			"Learn how to integrate Mockspec API mocking with Node.js. Setup guide, code examples, and best practices for mocking APIs in Node.js applications.",
		icon: "nodejs",
		installCommand: "npm install node-fetch",
		setupSteps: [
			"Create a project in Mockspec and get your API key",
			"Install node-fetch or use native fetch (Node 18+)",
			"Set up your base URL and headers",
			"Make requests to your mock endpoints",
		],
		exampleCode: `const API_KEY = "mk_your_api_key";
const BASE_URL = "https://api.mockspec.dev/mock";

async function fetchUsers() {
  const response = await fetch(\`\${BASE_URL}/users\`, {
    headers: {
      "X-API-Key": API_KEY,
    },
  });
  return response.json();
}

// Use in your application
const users = await fetchUsers();
console.log(users);`,
		features: [
			"Works with native fetch (Node 18+) or node-fetch",
			"Compatible with Express, Fastify, Koa, and other frameworks",
			"Ideal for testing webhooks and external API integrations",
			"Supports both CommonJS and ES modules",
		],
	},
	{
		slug: "python",
		title: "Python",
		description:
			"Integrate Mockspec with Python using requests or httpx to mock APIs in your Django, Flask, or FastAPI applications.",
		metaDescription:
			"Learn how to integrate Mockspec API mocking with Python. Setup guide, code examples, and best practices for mocking APIs in Python applications.",
		icon: "python",
		installCommand: "pip install requests",
		setupSteps: [
			"Create a project in Mockspec and get your API key",
			"Install requests or httpx library",
			"Configure your API key and base URL",
			"Make requests to your mock endpoints",
		],
		exampleCode: `import requests

API_KEY = "mk_your_api_key"
BASE_URL = "https://api.mockspec.dev/mock"

def fetch_users():
    response = requests.get(
        f"{BASE_URL}/users",
        headers={"X-API-Key": API_KEY}
    )
    return response.json()

# Use in your application
users = fetch_users()
print(users)`,
		features: [
			"Works with requests, httpx, or aiohttp",
			"Compatible with Django, Flask, FastAPI, and more",
			"Great for testing async API integrations",
			"Supports Python 3.8+",
		],
	},
	{
		slug: "react",
		title: "React",
		description:
			"Build and test React applications with Mockspec. Perfect for prototyping UIs before your backend is ready.",
		metaDescription:
			"Learn how to integrate Mockspec API mocking with React. Setup guide, code examples, and best practices for mocking APIs in React applications.",
		icon: "react",
		installCommand: "npm create vite@latest my-app -- --template react-ts",
		setupSteps: [
			"Create a project in Mockspec and get your API key",
			"Set up environment variables for your API key",
			"Create a fetch wrapper or use React Query",
			"Build your UI with realistic mock data",
		],
		exampleCode: `// lib/api.ts
const API_KEY = import.meta.env.VITE_MOCKSPEC_API_KEY;
const BASE_URL = "https://api.mockspec.dev/mock";

export async function fetchUsers() {
  const response = await fetch(\`\${BASE_URL}/users\`, {
    headers: { "X-API-Key": API_KEY },
  });
  return response.json();
}

// components/UserList.tsx
import { useEffect, useState } from "react";
import { fetchUsers } from "../lib/api";

export function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers().then(setUsers);
  }, []);

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}`,
		features: [
			"Perfect for building UIs before backend is ready",
			"Works with React Query, SWR, or plain fetch",
			"Great for component storybooks and demos",
			"Supports Vite, Next.js, and Create React App",
		],
	},
	{
		slug: "go",
		title: "Go",
		description:
			"Use Mockspec with Go to mock external APIs in your microservices, CLI tools, and backend applications.",
		metaDescription:
			"Learn how to integrate Mockspec API mocking with Go. Setup guide, code examples, and best practices for mocking APIs in Go applications.",
		icon: "go",
		installCommand: "go mod init myapp",
		setupSteps: [
			"Create a project in Mockspec and get your API key",
			"Set up your HTTP client with headers",
			"Create wrapper functions for API calls",
			"Use in your application or tests",
		],
		exampleCode: `package main

import (
    "encoding/json"
    "fmt"
    "net/http"
)

const (
    apiKey  = "mk_your_api_key"
    baseURL = "https://api.mockspec.dev/mock"
)

type User struct {
    ID   int    \`json:"id"\`
    Name string \`json:"name"\`
}

func fetchUsers() ([]User, error) {
    req, _ := http.NewRequest("GET", baseURL+"/users", nil)
    req.Header.Set("X-API-Key", apiKey)

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var users []User
    json.NewDecoder(resp.Body).Decode(&users)
    return users, nil
}

func main() {
    users, _ := fetchUsers()
    fmt.Printf("%+v\\n", users)
}`,
		features: [
			"Works with net/http or popular HTTP clients",
			"Ideal for microservices and CLI tools",
			"Great for integration testing",
			"Zero external dependencies needed",
		],
	},
	{
		slug: "ruby",
		title: "Ruby",
		description:
			"Integrate Mockspec with Ruby to mock APIs in your Rails, Sinatra, or standalone Ruby applications.",
		metaDescription:
			"Learn how to integrate Mockspec API mocking with Ruby. Setup guide, code examples, and best practices for mocking APIs in Ruby applications.",
		icon: "ruby",
		installCommand: "gem install httparty",
		setupSteps: [
			"Create a project in Mockspec and get your API key",
			"Add httparty or faraday to your Gemfile",
			"Configure your API client",
			"Make requests to your mock endpoints",
		],
		exampleCode: `require 'httparty'

API_KEY = "mk_your_api_key"
BASE_URL = "https://api.mockspec.dev/mock"

class MockspecClient
  include HTTParty
  base_uri BASE_URL
  headers "X-API-Key" => API_KEY

  def self.fetch_users
    get("/users")
  end
end

# Use in your application
users = MockspecClient.fetch_users
puts users`,
		features: [
			"Works with HTTParty, Faraday, or Net::HTTP",
			"Compatible with Rails, Sinatra, and Hanami",
			"Great for RSpec integration tests",
			"Supports Ruby 2.7+",
		],
	},
];

export function getIntegration(slug: string): Integration | undefined {
	return integrations.find((i) => i.slug === slug);
}

export function getAllIntegrationSlugs(): string[] {
	return integrations.map((i) => i.slug);
}
