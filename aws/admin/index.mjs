import { createHash, timingSafeEqual } from "node:crypto";
import { load as parseYaml, dump as dumpYaml } from "js-yaml";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH ?? "main";
const KEY_HASH = process.env.ADMIN_KEY_HASH ?? "";

const MENU_DIR = "src/content/menu";
const LANGUAGES = ["de", "en"];
const GROUPS = ["lunch-special", "set-menus", "menu"];

const api = async (path, options = {}) => {
    const response = await fetch(`https://api.github.com${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "maseltopf-admin",
            "X-GitHub-Api-Version": "2022-11-28",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers,
        },
    });

    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`github ${path} -> ${response.status} ${detail.slice(0, 300)}`);
    }

    return response.json();
};

class InputError extends Error {}

const reply = (statusCode, body) => ({
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(body),
});

const authorised = (key) => {
    if (!KEY_HASH || typeof key !== "string" || !key) return false;
    const given = createHash("sha256").update(key).digest();
    const expected = Buffer.from(KEY_HASH, "hex");
    if (given.length !== expected.length) return false;
    return timingSafeEqual(given, expected);
};

const parseFile = (text) => {
    const match = /^---\n([\s\S]*?)\n---\s*$/.exec(text.trim());
    if (!match) throw new InputError("file has no front matter");
    return parseYaml(match[1]) ?? {};
};

const serialiseFile = (data) => {
    const body = dumpYaml(data, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        quotingType: '"',
    });
    return `---\n${body}---\n`;
};

const asNumber = (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) throw new InputError(`price is not a number: ${value}`);
    return Math.round(number * 100) / 100;
};

const cleanDish = (dish, where) => {
    const name = typeof dish.name === "string" ? dish.name.trim() : "";
    if (!name) throw new InputError(`${where}: a dish has no name`);

    const result = { name };

    if (typeof dish.key === "string" && dish.key.trim()) result.key = dish.key.trim();

    const description = typeof dish.description === "string" ? dish.description.trim() : "";
    if (description) result.description = description;

    const price = asNumber(dish.price);
    if (price !== undefined) result.price = price;

    const priceText = typeof dish.priceText === "string" ? dish.priceText.trim() : "";
    if (priceText) result.priceText = priceText;

    if (Array.isArray(dish.tags)) {
        const tags = dish.tags.filter((tag) => typeof tag === "string" && tag.trim());
        if (tags.length) result.tags = tags;
    }

    if (typeof dish.variantsNote === "string" && dish.variantsNote.trim()) {
        result.variantsNote = dish.variantsNote.trim();
    }

    if (Array.isArray(dish.variants)) {
        const variants = dish.variants
            .filter((variant) => variant && typeof variant.name === "string" && variant.name.trim())
            .map((variant) => ({
                name: variant.name.trim(),
                price: asNumber(variant.price) ?? 0,
            }));
        if (variants.length) result.variants = variants;
    }

    return result;
};

const cleanSection = (data, path) => {
    const title = typeof data.title === "string" ? data.title.trim() : "";
    if (!title) throw new InputError(`${path}: the section has no title`);

    const result = { title };

    const order = Number(data.order);
    result.order = Number.isFinite(order) ? order : 99;

    const group = GROUPS.includes(data.group) ? data.group : "menu";
    if (group !== "menu") result.group = group;

    if (typeof data.note === "string" && data.note.trim()) result.note = data.note.trim();

    const dishes = Array.isArray(data.dishes) ? data.dishes : [];
    if (dishes.length) result.dishes = dishes.map((dish) => cleanDish(dish, path));

    if (Array.isArray(data.menus) && data.menus.length) result.menus = data.menus;

    return result;
};

const safePath = (path) => {
    if (typeof path !== "string") return false;
    const match = /^src\/content\/menu\/(de|en)\/[0-9a-z-]+\.md$/.exec(path);
    return Boolean(match);
};

const load = async () => {
    const files = [];

    for (const language of LANGUAGES) {
        const listing = await api(
            `/repos/${GITHUB_REPO}/contents/${MENU_DIR}/${language}?ref=${BRANCH}`,
        );

        for (const entry of listing) {
            if (entry.type !== "file" || !entry.name.endsWith(".md")) continue;
            const file = await api(
                `/repos/${GITHUB_REPO}/contents/${entry.path}?ref=${BRANCH}`,
            );
            const text = Buffer.from(file.content, "base64").toString("utf8");
            files.push({ path: entry.path, language, data: parseFile(text) });
        }
    }

    files.sort((a, b) => a.path.localeCompare(b.path));
    return files;
};

const save = async (files, note) => {
    if (!Array.isArray(files) || !files.length) throw new InputError("nothing to save");
    if (files.length > 40) throw new InputError("too many files at once");

    for (const file of files) {
        if (!safePath(file.path)) throw new InputError(`path not allowed: ${file.path}`);
    }

    const head = await api(`/repos/${GITHUB_REPO}/git/ref/heads/${BRANCH}`);
    const commitSha = head.object.sha;
    const commit = await api(`/repos/${GITHUB_REPO}/git/commits/${commitSha}`);

    const tree = [];
    for (const file of files) {
        const content = serialiseFile(cleanSection(file.data, file.path));
        const blob = await api(`/repos/${GITHUB_REPO}/git/blobs`, {
            method: "POST",
            body: JSON.stringify({ content, encoding: "utf-8" }),
        });
        tree.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
    }

    const newTree = await api(`/repos/${GITHUB_REPO}/git/trees`, {
        method: "POST",
        body: JSON.stringify({ base_tree: commit.tree.sha, tree }),
    });

    const message = typeof note === "string" && note.trim()
        ? `content: ${note.trim().slice(0, 100)}`
        : "content: menu update from the admin page";

    const created = await api(`/repos/${GITHUB_REPO}/git/commits`, {
        method: "POST",
        body: JSON.stringify({ message, tree: newTree.sha, parents: [commitSha] }),
    });

    await api(`/repos/${GITHUB_REPO}/git/refs/heads/${BRANCH}`, {
        method: "PATCH",
        body: JSON.stringify({ sha: created.sha }),
    });

    return { commit: created.sha.slice(0, 7), files: files.length };
};

export const handler = async (event) => {
    const method = event.requestContext?.http?.method ?? "POST";
    if (method !== "POST") return reply(405, { error: "method not allowed" });

    const raw = event.isBase64Encoded
        ? Buffer.from(event.body ?? "", "base64").toString("utf8")
        : (event.body ?? "");

    let payload;
    try {
        payload = JSON.parse(raw);
    } catch {
        return reply(400, { error: "invalid json" });
    }

    if (!authorised(payload?.key)) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return reply(401, { error: "wrong key" });
    }

    try {
        if (payload.action === "load") return reply(200, { files: await load() });
        if (payload.action === "save") {
            return reply(200, await save(payload.files, payload.note));
        }
        return reply(400, { error: "unknown action" });
    } catch (error) {
        console.error("admin failed", error);
        const status = error instanceof InputError ? 400 : 500;
        return reply(status, { error: String(error.message ?? error).slice(0, 300) });
    }
};
