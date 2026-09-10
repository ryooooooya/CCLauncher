import { expect, test } from "@playwright/test";
import { actor, createDocument, guest, paths } from "./target";

test("owner can read, update and delete their document", async () => {
  const owner = await actor("owner");
  const doc = await createDocument(owner);
  const path = `${paths.documents}/${doc.id}`;
  try {
    expect((await owner.get(path)).status()).toBe(200);
    const update = await owner.patch(path, {
      data: { body: "updated by owner" },
    });
    expect(update.status()).toBe(200);
    expect((await (await owner.get(path)).json()).body).toBe(
      "updated by owner",
    );
    expect((await owner.delete(path)).status()).toBe(200);
    expect((await owner.get(path)).status()).toBe(404);
  } finally {
    await owner.delete(path);
    await owner.dispose();
  }
});

for (const name of ["guest", "other", "admin"] as const) {
  test(`${name} cannot read, enumerate, update or delete the owner's document`, async () => {
    const owner = await actor("owner");
    const outsider = name === "guest" ? await guest() : await actor(name);
    const doc = await createDocument(owner);
    const path = `${paths.documents}/${doc.id}`;
    try {
      if (name !== "guest") {
        const ownerId = (await (await owner.get(paths.session)).json()).id;
        const outsiderId = (await (await outsider.get(paths.session)).json())
          .id;
        expect(outsiderId, "Fixtures must be distinct users").not.toBe(ownerId);
      }
      for (const response of [
        await outsider.get(path),
        await outsider.patch(path, { data: { body: "attack" } }),
        await outsider.delete(path),
      ]) {
        expect(response.status()).toBe(name === "guest" ? 401 : 404);
        expect(await response.text()).not.toContain(doc.body);
      }
      const list = await outsider.get(`${paths.documents}?id=${doc.id}`);
      expect(list.status()).toBe(name === "guest" ? 401 : 200);
      expect(await list.text()).not.toContain(doc.id);
      const unchanged = await owner.get(path);
      expect(unchanged.status()).toBe(200);
      expect((await unchanged.json()).body).toBe(doc.body);
    } finally {
      await owner.delete(path);
      await outsider.dispose();
      await owner.dispose();
    }
  });
}

test("forged ownership and cross-origin mutations cannot change a document", async () => {
  const owner = await actor("owner");
  const doc = await createDocument(owner);
  const path = `${paths.documents}/${doc.id}`;
  try {
    const forged = { body: "attack", owner_id: crypto.randomUUID() };
    expect((await owner.post(paths.documents, { data: forged })).status()).toBe(
      400,
    );
    expect((await owner.patch(path, { data: forged })).status()).toBe(400);
    expect(
      (
        await owner.patch(path, {
          data: { body: "attack" },
          headers: { Origin: "https://untrusted.invalid" },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await owner.delete(path, {
          headers: { Origin: "https://untrusted.invalid" },
        })
      ).status(),
    ).toBe(403);
    expect((await (await owner.get(path)).json()).body).toBe(doc.body);
  } finally {
    await owner.delete(path);
    await owner.dispose();
  }
});
