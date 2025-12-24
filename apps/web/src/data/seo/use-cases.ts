export type UseCase = {
	slug: string;
	title: string;
	description: string;
	metaDescription: string;
	problem: string;
	solution: string;
	benefits: string[];
	exampleCode: string;
	relatedFeatures: string[];
};

export const useCases: UseCase[] = [
	{
		slug: "demo-environments",
		title: "Demo Environments",
		description:
			"Create reliable demo environments with consistent, realistic data that never breaks or expires.",
		metaDescription:
			"Learn how to build demo environments with Mockspec. Create reliable product demos with consistent mock data that works every time.",
		problem:
			"Product demos fail at the worst times. Staging environments break, test data gets corrupted, and sandbox APIs have rate limits or expire. Nothing kills a sales call faster than 'let me refresh this' or 'it usually works'.",
		solution:
			"Mockspec provides rock-solid mock APIs for demos. Define exactly the data you want to show, ensure it's always available, and never worry about external dependencies ruining your presentation.",
		benefits: [
			"Demos that work every time, guaranteed",
			"Consistent data across all demo sessions",
			"No sandbox API rate limits or expirations",
			"Showcase features before backend is complete",
			"Isolated from staging/production issues",
		],
		exampleCode: `// Mockspec endpoint for demo: GET /api/dashboard
// Use static data for consistent demos
{
  "metrics": {
    "revenue": 142850,
    "growth": 23.5,
    "customers": 1847,
    "conversionRate": 4.2
  },
  "recentOrders": [
    {"id": "ORD-1001", "customer": "Alice Smith", "amount": 299.99, "status": "completed"},
    {"id": "ORD-1002", "customer": "Bob Johnson", "amount": 149.50, "status": "completed"},
    {"id": "ORD-1003", "customer": "Carol White", "amount": 599.00, "status": "completed"}
  ]
}

// Point your demo app at Mockspec
const API_URL = process.env.DEMO_MODE
  ? "https://api.mockspec.dev/mock"
  : "https://api.production.com";`,
		relatedFeatures: ["Response Templates", "Stateful Mocks", "Endpoints"],
	},
	{
		slug: "ci-cd-integration",
		title: "CI/CD Integration",
		description:
			"Run integration tests in your CI/CD pipeline without depending on external APIs or staging environments.",
		metaDescription:
			"Learn how to use Mockspec in CI/CD pipelines. Run reliable integration tests without external API dependencies or flaky staging environments.",
		problem:
			"Integration tests that depend on external APIs are flaky. Rate limits, network issues, and service outages cause random failures. Staging environments are expensive and often out of sync with production.",
		solution:
			"Mockspec provides consistent, reliable mock APIs for your CI/CD pipeline. Tests run faster, never hit rate limits, and produce deterministic results every time.",
		benefits: [
			"Eliminate flaky tests from external API dependencies",
			"Run tests faster without network latency",
			"No rate limit concerns in CI/CD",
			"Consistent test data across all environments",
			"Reduce CI/CD costs with faster pipelines",
		],
		exampleCode: `# GitHub Actions example
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run integration tests
        env:
          MOCKSPEC_API_KEY: \${{ secrets.MOCKSPEC_API_KEY }}
          API_BASE_URL: https://api.mockspec.dev/mock
        run: |
          npm ci
          npm run test:integration`,
		relatedFeatures: ["Stateful Mocks", "Rate Limits", "Request Logs"],
	},
	{
		slug: "offline-development",
		title: "Offline Development",
		description:
			"Continue building features when you're offline or when external APIs are unavailable.",
		metaDescription:
			"Learn how to develop offline with Mockspec. Build features without internet access or when external APIs are down.",
		problem:
			"Modern applications depend on many external APIs. When you're offline, on a plane, or when an API is down, development grinds to a halt. You can't test features that require external data.",
		solution:
			"Mockspec mock endpoints work independently of the real APIs. Pre-configure your mock responses and continue development regardless of network connectivity or third-party service status.",
		benefits: [
			"Develop features without internet access",
			"No blocked work when external APIs are down",
			"Faster development with instant responses",
			"Work from anywhere, anytime",
			"Reduce dependency on third-party uptime",
		],
		exampleCode: `// Environment-based API switching
const API_BASE = process.env.NODE_ENV === "development"
  ? "https://api.mockspec.dev/mock"
  : "https://api.production.com";

const API_KEY = process.env.NODE_ENV === "development"
  ? process.env.MOCKSPEC_API_KEY
  : process.env.PRODUCTION_API_KEY;

async function fetchData(endpoint) {
  const response = await fetch(\`\${API_BASE}\${endpoint}\`, {
    headers: { "X-API-Key": API_KEY },
  });
  return response.json();
}

// Works the same in dev (mocked) and prod (real)
const users = await fetchData("/users");`,
		relatedFeatures: ["Endpoints", "Response Templates", "Stateful Mocks"],
	},
	{
		slug: "frontend-prototyping",
		title: "Frontend Prototyping",
		description:
			"Build and demo frontend features before the backend is ready. Ship faster with parallel development.",
		metaDescription:
			"Learn how to prototype frontends with Mockspec. Build UIs with realistic mock data before your backend API is ready.",
		problem:
			"Frontend development often waits for backend APIs. This creates bottlenecks, delays releases, and makes it hard to iterate on UI designs. You need real-looking data to build a convincing prototype.",
		solution:
			"Mockspec lets frontend teams define the API contract upfront and start building immediately. Use response templates to generate realistic data that matches your expected API structure.",
		benefits: [
			"Start frontend work before backend is ready",
			"Parallel development reduces time to market",
			"Realistic mock data for demos and stakeholder reviews",
			"Easy to iterate on API contracts",
			"Smooth handoff when backend is complete",
		],
		exampleCode: `// Define your expected API response in Mockspec
// GET /api/products
// Use templates to generate dynamic data on each request

{
  "products": [
    {
      "id": "{{uuid}}",
      "name": "{{sentence}}",
      "price": {{float 200 2}},
      "image": "{{imageUrl}}",
      "inStock": true
    }
  ],
  "total": 1,
  "page": 1
}

// Build your React component
function ProductGrid() {
  const { data } = useQuery("products", fetchProducts);

  return (
    <div className="grid grid-cols-3 gap-4">
      {data?.products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}`,
		relatedFeatures: ["Response Templates", "OpenAPI Import", "Stateful Mocks"],
	},
	{
		slug: "load-testing",
		title: "Load Testing",
		description:
			"Simulate high-traffic scenarios and test how your application handles API failures and slow responses.",
		metaDescription:
			"Learn how to perform load testing with Mockspec. Simulate slow responses, failures, and high latency to test application resilience.",
		problem:
			"Testing how your application handles API failures, slow responses, and high latency is difficult. You can't easily make production APIs misbehave, and setting up failure scenarios is time-consuming.",
		solution:
			"Mockspec's chaos engineering features let you simulate delays, timeouts, and error responses. Test your error handling, retry logic, and user experience under adverse conditions.",
		benefits: [
			"Simulate slow API responses with configurable delays",
			"Test error handling with controlled failures",
			"Verify retry logic and circuit breakers",
			"Ensure good UX during API issues",
			"No need to break production to test failures",
		],
		exampleCode: `// Mockspec chaos configuration
// Endpoint: GET /api/users

// Settings:
// - Delay: 2000-5000ms (random)
// - Failure rate: 30%
// - Failure response: 503 Service Unavailable

// Test your resilience
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: { "X-API-Key": API_KEY },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) return response.json();
      if (response.status >= 500 && i < retries - 1) continue;

      throw new Error(\`HTTP \${response.status}\`);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}`,
		relatedFeatures: ["Chaos Engineering", "Rate Limits", "Request Logs"],
	},
];

export function getUseCase(slug: string): UseCase | undefined {
	return useCases.find((u) => u.slug === slug);
}

export function getAllUseCaseSlugs(): string[] {
	return useCases.map((u) => u.slug);
}
