import { renderHtml } from "./renderHtml";

export default {
    async fetch(request, env): Promise<Response> {
        const { pathname } = new URL(request.url);
        const db = env.DB;
        console.log("pathname ", pathname);
        console.log("request.method ", request.method);

        if (request.method === "GET") {
            let stmt;
            let results;
            if (pathname === "/num") {
                stmt = await db.prepare("SELECT * FROM numeros");
            } else {
                stmt = env.DB.prepare("SELECT * FROM comments LIMIT 3");
            }
            results = await stmt.all();
            console.log("results ", results);
            console.log("results.results ", results.results);
            results.results[3] = { pathname: pathname };

            return new Response(renderHtml(JSON.stringify(results, null, 2)), {
                headers: {
                    "content-type": "text/html",
                },
            });
        }

        if (request.method === "POST") {
            const body: { numeros: { hiragana: string; kanji: string; castellano: string }[] } = await request.json();

            // Usa for...of en lugar de forEach para manejar await correctamente
            for (const e of body.numeros) {
                const { hiragana, kanji, castellano } = e; // Extrae de 'e' (el elemento actual), no de 'body'
                console.log("Insertando:", e);

                try {
                    const { results } = await db
                        .prepare(
                            "INSERT INTO numeros (palabra_hiragana, palabra_kanji, palabra_castellano) VALUES (?, ?, ?)"
                        )
                        .bind(hiragana, kanji, castellano)
                        .run();
                    console.log("Insertado correctamente:", results);
                } catch (error) {
                    console.error("Error al insertar " + e + " :", error);
                }
            }

            /*const body = await request.json();
      body.numeros.forEach(e => {
        const { hiragana, kanji, castellano } = body;
        console.log("e ", e)
        const { results } = await db
                    .prepare("INSERT INTO numeros (palabra_hiragana, palabra_kanji, palabra_castellano) VALUES (?, ?, ?)")
                    .bind(hiragana, kanji, castellano)
                    .run();
      });

      
                return new Response(JSON.stringify({ message: 'User created successfully', id: results.lastRowId }), {
                    status: 201,
                    headers: { 'Content-Type': 'application/json' },
                });*/
        }

        // Return a default response if no conditions are met
        return new Response("Not Found", { status: 404 });
    },
} satisfies ExportedHandler<Env>;
