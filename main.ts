import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 1 - Crea el Servidor.
// Es la interfaz principal con el protocolo MCP. MAneja la comunicación entre el cliente y el servidor.

const server = new McpServer({
  name: "MyServer",
  version: "1.0.0",
});

// 2 - Define las herramientas que el servidor va a exponer al cliente
// Las herramientas le perimte al LLM realizar acciones a través de la API del servidor.

server.tool(
  "getWeather",
  "Get the weather for a given city",
  {
    city: z.string().describe("The name of the city"),
    // description: "Get the weather for a given city",
    // parameters: z.object({
    //   city: z.string().describe("The name of the city"),
    // }),
    // response: z.object({
    //   temperature: z.number(),
    //   description: z.string(),
    // }),
  },
  async ({ city }) => {
    const weatherResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`
    );
    const weatherData = await weatherResponse.json();

    if (weatherData.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No se encontró información del clima para ${city}`,
          },
        ],
      };
    }

    const { latitude, longitude } = weatherData.results[0];

    const forecastData = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&current=temperature_2m,precipitation,rain,is_day`
    );

    const forecast = await forecastData.json();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(forecast, null, 2),
        },
      ],
    };
  }
);

// 3 - Escuchar las conexiones de los clientes

const transport = new StdioServerTransport();
await server.connect(transport);

// npx -y @modelcontextprotocol/inspector npx -y tsx main.ts
