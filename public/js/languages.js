const LANGUAGES = [
  { id: "javascript", label: "JavaScript", piston: "javascript", ext: "js",    starter: 'console.log("Hello from Universe!");' },
  { id: "typescript", label: "TypeScript", piston: "typescript", ext: "ts",    starter: 'const msg: string = "Hello!";\nconsole.log(msg);' },
  { id: "python",     label: "Python",     piston: "python",     ext: "py",    starter: 'print("Hello from Universe!")' },
  { id: "java",       label: "Java",       piston: "java",       ext: "java",  starter: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello from Universe!");\n  }\n}' },
  { id: "c",          label: "C",          piston: "c",          ext: "c",     starter: '#include <stdio.h>\nint main() {\n  printf("Hello from Universe!\\n");\n  return 0;\n}' },
  { id: "cpp",        label: "C++",        piston: "cpp",        ext: "cpp",   starter: '#include <iostream>\nint main() {\n  std::cout << "Hello from Universe!" << std::endl;\n  return 0;\n}' },
  { id: "csharp",     label: "C#",         piston: "csharp",     ext: "cs",    starter: 'using System;\nclass Program {\n  static void Main() { Console.WriteLine("Hello from Universe!"); }\n}' },
  { id: "go",         label: "Go",         piston: "go",         ext: "go",    starter: 'package main\nimport "fmt"\nfunc main() { fmt.Println("Hello from Universe!") }' },
  { id: "rust",       label: "Rust",       piston: "rust",       ext: "rs",    starter: 'fn main() { println!("Hello from Universe!"); }' },
  { id: "ruby",       label: "Ruby",       piston: "ruby",       ext: "rb",    starter: 'puts "Hello from Universe!"' },
  { id: "php",        label: "PHP",        piston: "php",        ext: "php",   starter: '<?php\necho "Hello from Universe!\\n";' },
  { id: "swift",      label: "Swift",      piston: "swift",      ext: "swift", starter: 'print("Hello from Universe!")' },
  { id: "kotlin",     label: "Kotlin",     piston: "kotlin",     ext: "kt",    starter: 'fun main() { println("Hello from Universe!") }' },
  { id: "lua",        label: "Lua",        piston: "lua",        ext: "lua",   starter: 'print("Hello from Universe!")' },
  { id: "bash",       label: "Bash",       piston: "bash",       ext: "sh",    starter: 'echo "Hello from Universe!"' },
  { id: "perl",       label: "Perl",       piston: "perl",       ext: "pl",    starter: 'print "Hello from Universe!\\n";' },
  { id: "r",          label: "R",          piston: "r",          ext: "r",     starter: 'cat("Hello from Universe!\\n")' },
  { id: "dart",       label: "Dart",       piston: "dart",       ext: "dart",  starter: 'void main() { print("Hello from Universe!"); }' },
  { id: "haskell",    label: "Haskell",    piston: "haskell",    ext: "hs",    starter: 'main = putStrLn "Hello from Universe!"' },
  { id: "html",       label: "HTML",       piston: null,         ext: "html",  starter: '<!doctype html>\n<html>\n<body>\n  <h1>Hello from Universe!</h1>\n</body>\n</html>' },
];

function getLanguage(id) {
  return LANGUAGES.find(l => l.id === id) ?? LANGUAGES[0];
}
