interface Env {}

// Helper to check if a character is an operator
const isOperator = (char: string): boolean => {
  return ['+', '-', '*', '/', '^'].includes(char);
};

// Helper to get operator precedence
const getPrecedence = (operator: string): number => {
  switch (operator) {
    case '^':
      return 3;
    case '*':
    case '/':
      return 2;
    case '+':
    case '-':
      return 1;
    default:
      return 0;
  }
};

// Helper to apply operation
const applyOperation = (a: number, b: number, operator: string): number => {
  switch (operator) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      if (b === 0) throw new Error('Division by zero');
      return a / b;
    case '^':
      return Math.pow(a, b);
    default:
      throw new Error('Invalid operator');
  }
};

// Convert infix expression to postfix notation
const infixToPostfix = (expression: string): string[] => {
  const output: string[] = [];
  const operators: string[] = [];
  let number = '';

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];

    if (char === ' ') continue;

    if (/[\d.]/.test(char)) {
      number += char;
    } else {
      if (number) {
        output.push(number);
        number = '';
      }

      if (char === '(') {
        operators.push(char);
      } else if (char === ')') {
        while (operators.length > 0 && operators[operators.length - 1] !== '(') {
          output.push(operators.pop()!);
        }
        operators.pop(); // Remove '('
      } else if (isOperator(char)) {
        while (
          operators.length > 0 &&
          operators[operators.length - 1] !== '(' &&
          getPrecedence(operators[operators.length - 1]) >= getPrecedence(char)
        ) {
          output.push(operators.pop()!);
        }
        operators.push(char);
      }
    }
  }

  if (number) {
    output.push(number);
  }

  while (operators.length > 0) {
    output.push(operators.pop()!);
  }

  return output;
};

// Evaluate postfix expression
const evaluatePostfix = (tokens: string[]): number => {
  const stack: number[] = [];

  for (const token of tokens) {
    if (isOperator(token)) {
      const b = stack.pop()!;
      const a = stack.pop()!;
      stack.push(applyOperation(a, b, token));
    } else {
      stack.push(parseFloat(token));
    }
  }

  return stack[0];
};

// Calculate expression
const calculateExpression = (expression: string): number => {
  const sanitizedExpression = expression.replace(/\s+/g, '');
  const postfix = infixToPostfix(sanitizedExpression);
  return evaluatePostfix(postfix);
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Serve static content for root path
    if (url.pathname === '/') {
      return new Response(HTML, {
        headers: {
          'content-type': 'text/html;charset=UTF-8',
        },
      });
    }

    // Handle API requests
    if (url.pathname === '/api/calculate') {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
      }

      try {
        const data = await request.json();
        if (!data.expression) {
          return Response.json({ error: 'Expression is required' }, { status: 400 });
        }

        const result = calculateExpression(data.expression);
        return Response.json({ result });
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : 'Invalid expression' },
          { status: 400 }
        );
      }
    }

    return new Response('Not found', { status: 404 });
  },
};

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calculator API</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold text-center mb-8 text-gray-800">Calculator API</h1>
        
        <div class="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
            <div class="mb-4">
                <input type="text" id="expression" 
                       class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Enter expression (e.g., 2 + 2)">
            </div>
            
            <button onclick="calculate()" 
                    class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200">
                Calculate
            </button>
            
            <div id="result" class="mt-4 text-xl text-center font-semibold text-gray-700"></div>
        </div>

        <div class="max-w-md mx-auto mt-8">
            <h2 class="text-2xl font-bold mb-4 text-gray-800">API Usage</h2>
            <div class="bg-gray-800 rounded-lg p-4">
                <pre class="text-green-400">
POST /api/calculate
Content-Type: application/json

{
    "expression": "2 + 2"
}</pre>
            </div>
            
            <h3 class="text-xl font-bold mt-6 mb-2 text-gray-800">Supported Operations</h3>
            <ul class="list-disc list-inside text-gray-700">
                <li>Addition (+)</li>
                <li>Subtraction (-)</li>
                <li>Multiplication (*)</li>
                <li>Division (/)</li>
                <li>Exponentiation (^)</li>
                <li>Parentheses ( )</li>
            </ul>
        </div>
    </div>

    <script>
        async function calculate() {
            const expressionInput = document.getElementById('expression');
            const resultDiv = document.getElementById('result');
            
            try {
                const response = await fetch('/api/calculate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        expression: expressionInput.value
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    resultDiv.textContent = \`Result: \${data.result}\`;
                    resultDiv.className = 'mt-4 text-xl text-center font-semibold text-gray-700';
                } else {
                    resultDiv.textContent = \`Error: \${data.error}\`;
                    resultDiv.className = 'mt-4 text-xl text-center font-semibold text-red-600';
                }
            } catch (error) {
                resultDiv.textContent = 'Error: Something went wrong';
                resultDiv.className = 'mt-4 text-xl text-center font-semibold text-red-600';
            }
        }

        // Allow Enter key to trigger calculation
        document.getElementById('expression').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculate();
            }
        });
    </script>
</body>
</html>`;