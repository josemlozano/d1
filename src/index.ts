// import { renderHtml } from "./renderHtml";

export default {
    async fetch(request, env): Promise<Response> {
        const { pathname } = new URL(request.url);
        const db = env.DB;
        console.log("pathname ", pathname);
        console.log("request.method ", request.method);

        if (request.method === "GET") {
            const results = await getData(db, pathname);
            return new Response(JSON.stringify(results, null, 2), {
                headers: {
                    "content-type": "text/html",
                },
            });
        }

        if (request.method === "POST") {
            const body: {
                numeros: {
                    hiragana: string;
                    kanji: string;
                    castellano: string;
                }[];
            } = await request.json();

            for (const e of body.numeros) {
                console.log("Insertando:", e);

                await insertData(db, "numeros", {
                    palabra_hiragana: e.hiragana,
                    palabra_kanji: e.kanji,
                    palabra_castellano: e.castellano,
                });
            }
        }

        return new Response("Not Found", { status: 404 });
    },
} satisfies ExportedHandler<Env>;

const getData = async (db: D1Database, pathname: string) => {
    let stmt;
    if (pathname === "/num") {
        stmt = await db.prepare("SELECT * FROM numeros");
    } else {
        stmt = db.prepare("SELECT * FROM comments LIMIT 3");
    }
    const results = await stmt.all();
    console.log("results ", results);
    console.log("results.results ", results.results);
    results.results[3] = { pathname: pathname };
    return results;
};

const insertData = async (
    db: D1Database,
    tableName: string,
    data: Record<string, any>
): Promise<void> => {
    const columns = Object.keys(data).join(", ");
    const placeholders = Object.keys(data).map(() => "?").join(", ");
    const values = Object.values(data);

    try {
        const { results } = await db
            .prepare(
                `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`
            )
            .bind(...values)
            .run();
        console.log("Insertado correctamente:", results);
    } catch (error) {
        console.error("Error al insertar datos:", error);
    }
};