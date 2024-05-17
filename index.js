import express from "express";
import bodyParser from "body-parser";
import pg from 'pg';

const app = express();
const port = 3000;

const db = new pg.Client({
  user:"postgres",
  host:"localhost",
  database:"postgres",
  password:"0000",
  port:5432
})

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let sort = "book_name";

app.post("/", async (req, res) => {
  const opt = req.body.sort_option;
  // console.log(opt);
  if (opt == "title_option") {
    sort = "book_name";
  } else if (opt == "newest_option") {
    sort = "date_read";
  } else if (opt == "best_option") {
    sort = "rating";
  }
  // console.log(sort);
  res.redirect("/");
});

app.get("/", async (req, res) => {

  let books = [];
  // API_URL = "https://covers.openlibrary.org/b/isbn/9780385533225-M.jpg"; example
  let result = [];
  if (sort !== "book_name") {
    result = await db.query(
      "select * from books order by "+sort+" desc");
  } else {
    result = await db.query(
    "select * from books order by "+sort);
  }
  
  
  result.rows.forEach(element => {
    books.push(element);
    // console.log(element.book_name);
  });

  // console.log((books[0].date_read.getDate()));

  res.render("index.ejs", {
    Title: "Book Notes",
    Books: books,
    api_url: "https://covers.openlibrary.org/b/isbn/",
    option_selected: sort
  });
});

app.get("/add-book", async (req, res) => {
  res.render("add_book.ejs");
});

app.post("/add-book", async (req, res) => {

  db.query(
    "insert into books (book_name, author_name, summary, notes, isbn_number, rating) values ($1, $2, $3, $4, $5, $6) returning *;", 
    [req.body.book_name, 
      req.body.author_name,
      req.body.summary,
      req.body.notes,
      req.body.isbn_number,
      req.body.rating
    ]);

    res.redirect("/");
});

app.get("/:id/edit", async (req, res) => {
    const book_id = req.params.id;
  // console.log(req.params.id);

  const result = await db.query(
    "select * from books where id=($1)", [book_id]);

  const element = result.rows[0];

  res.render("edit.ejs", {
    book_id : book_id,
    book_name : element.book_name,
    author_name : element.author_name,
    isbn_number : element.isbn_number,
    summary : element.summary,
    notes : element.notes.split("\n\n"),
    rating: element.rating
  });
});

app.post("/edit", async (req, res) => {
  
  db.query(
    "update books set book_name=($1), author_name=($2), summary=($3), notes=($4), isbn_number=($5), rating=($6) where id=($7)", 
    [req.body.book_name, 
      req.body.author_name,
      req.body.summary,
      req.body.notes,
      req.body.isbn_number,
      req.body.rating,
      req.body.book_id
    ]);

  res.redirect("/"+req.body.book_id);
});

app.get("/:id", async (req, res) => {

  const book_id = req.params.id;
  // console.log(req.params.id);

  const result = await db.query(
    "select * from books where id=($1)", [book_id]);
  
  // result.rows.forEach(element => {
  //   console.log(element.isbn_number);
  // });

  const element = result.rows[0];
  // element.notes.split("\n").forEach(
  //   ele => {
  //     console.log(ele);
  //   }
  // );
  res.render("book_notes.ejs", {
    Title : "Book Notes",
    book_id : book_id,
    book_name : element.book_name,
    author_name : element.author_name,
    isbn_number : element.isbn_number,
    date_read : element.date_read,
    summary : element.summary,
    notes : element.notes.split("\n\n"),
    api_url : "https://covers.openlibrary.org/b/isbn/",
    rating: element.rating
  });
});

app.post("/delete", async (req, res) => {
  // console.log(req.body.del_item);
  db.query("delete from books where isbn_number = ($1)", [req.body.del_item]);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
