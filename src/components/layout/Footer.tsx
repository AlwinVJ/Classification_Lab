export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-foreground">Classification Lab</p>
          <p>A beginner-friendly guide to machine learning classification.</p>
        </div>
        <a href="https://github.com" className="hover:text-foreground" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </div>
    </footer>
  );
}
