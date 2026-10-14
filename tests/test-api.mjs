const res = await fetch("https://token.sensenova.cn/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.SENSENOVA_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "deepseek-flash",
    messages: [{ role: "user", content: "hi" }],
    stream: true,
  }),
});

console.log("Status:", res.status);
console.log("Headers:", Object.fromEntries(res.headers));
console.log("Body:", await res.text());
