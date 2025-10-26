"use client";

export function SiteFooter() {
  return (
    <footer className="relative z-20">
      <div className="container mx-auto px-4">
        <div className="py-12 flex flex-col items-center gap-6">
          <h3 className="text-2xl font-bold tracking-widest">ARGUS</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Built by</p>
              <p className="font-medium text-foreground">Carson Spriggs-Audet</p>
              <div className="mt-2 flex items-center justify-center gap-4 text-sm">
                <a href="https://www.linkedin.com/in/carsonspriggs" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">LinkedIn</a>
                <a href="https://github.com/carsonSgit" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">GitHub</a>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Built by</p>
              <p className="font-medium text-foreground">Marcus Lee</p>
              <div className="mt-2 flex items-center justify-center gap-4 text-sm">
                <a href="https://www.linkedin.com/in/marcus-m-lee/" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">LinkedIn</a>
                <a href="https://github.com/godpuffin" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">GitHub</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


