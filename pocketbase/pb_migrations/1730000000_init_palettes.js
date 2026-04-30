/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");

  const collection = new Collection({
    name: "palettes",
    type: "base",
    listRule: "owner = @request.auth.id",
    viewRule: "owner = @request.auth.id",
    createRule: "@request.auth.id != \"\"",
    updateRule: "owner = @request.auth.id",
    deleteRule: "owner = @request.auth.id",
    fields: [
      { name: "name", type: "text", required: true, max: 120 },
      { name: "swatches", type: "json", required: true, maxSize: 2000000 },
      {
        name: "source",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["photo", "generate", "prompt", "ref"],
      },
      {
        name: "thumbnail",
        type: "file",
        required: false,
        maxSelect: 1,
        maxSize: 2097152,
        mimeTypes: ["image/png", "image/jpeg", "image/webp"],
      },
      {
        name: "owner",
        type: "relation",
        required: true,
        collectionId: users.id,
        cascadeDelete: true,
        maxSelect: 1,
      },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("palettes");
  return app.delete(collection);
});
