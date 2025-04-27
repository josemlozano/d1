type Body = {
    numeros?: Array<{
        hiragana: string;
        kanji: string;
        castellano: string;
    }>;
    frases?: Array<{
        frase: string;
        particula_correcta: string;
        opcion_incorrecta_1: string;
        opcion_incorrecta_2: string;
        opcion_incorrecta_3: string;
    }>;
};

const routes: Record<
    string,
    {
        key: keyof Body;
        table: string;
        mapData: (e: any) => Record<string, any>;
    }
> = {
    "/num": {
        key: "numeros",
        table: "numeros",
        mapData: (e) => ({
            palabra_hiragana: e.hiragana,
            palabra_kanji: e.kanji,
            palabra_castellano: e.castellano,
        }),
    },
    "/frases": {
        key: "frases",
        table: "ejercicios_particulas",
        mapData: (e) => ({
            frase: e.frase,
            particula_correcta: e.particula_correcta,
            opcion_incorrecta_1: e.opcion_incorrecta_1,
            opcion_incorrecta_2: e.opcion_incorrecta_2,
            opcion_incorrecta_3: e.opcion_incorrecta_3,
        }),
    },
};

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
            const body = (await request.json()) as Body;
            const route = routes[pathname];

            if (route) {
                const items = body[route.key] ?? [];
                for (const item of items) {
                    console.log("Insertando:", item);
                    await insertData(db, route.table, route.mapData(item));
                }
                return new Response("Datos insertados correctamente.", { status: 200 });
            }

            return new Response("Ruta no válida.", { status: 404 });
        }

        return new Response("Not Found", { status: 404 });
    },
} satisfies ExportedHandler<Env>;

const getData = async (db: D1Database, pathname: string) => {
    let stmt;
    if (pathname === "/num") {
        stmt = await db.prepare("SELECT * FROM numeros");
    } else if (pathname === "/frases") {
        stmt = await db.prepare("SELECT * FROM ejercicios_particulas");
    } else {
        return new Response("Not Found", { status: 404 });
    }
    const { results } = await stmt.all();
    return results;
};

const insertData = async (
    db: D1Database,
    tableName: string,
    data: Record<string, any>
): Promise<void> => {
    const columns = Object.keys(data).join(", ");
    const placeholders = Object.keys(data)
        .map(() => "?")
        .join(", ");
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
