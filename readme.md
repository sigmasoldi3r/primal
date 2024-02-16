![](primal.png)

# Primal

A hack-though style development web server, using modern technologies in an old
fashion.

## Running

- Download (Or build) primal executables.
- Create a `www` (or whatever you like).
- Create a `index.eta` file inside, place `<h1>hey</h1>`(Or something else).
- (Optional) Create other some `.eta` and static files there.
- Run:

```sh
./primal --root www --port 8080
```

Then go to `http://localhost:8080` and see the results.

### The template language

Primal relies on [Eta template language](https://eta.js.org/) to render the
pages, see their documentation for specific language quirks and syntax.

But as a rule of thumb, you'll use:

- Javascript as programming language (Embed in the view file)
- And the function `await it.require()` to import Deno modules.

An example:

```ejs
<%

const { Database } = await it.require("https://deno.land/x/sqlite3@0.10.0/mod.ts");
const db = new Database("test.db");

const [version] = db.prepare("select sqlite_version()").value();

%>
<h1>Database test</h1>
<pre>
<code>
    Installed SQLite3 version = <%= version %>
</code>
</pre>
```
