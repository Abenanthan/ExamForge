const db = require('../db');

const questionsData = [
  // ==========================================
  // UNIT I: WEB BASICS, HTML AND CSS (15 MCQs: 5 Easy, 5 Med, 5 Hard)
  // ==========================================
  // EASY
  {
    unit_number: 1,
    unit_name: 'Unit I — Web Basics, HTML & CSS',
    topic: 'World Wide Web & Protocols',
    difficulty: 'Easy',
    question_text: 'What does the HTTP acronym stand for in web communication protocols?',
    option_a: 'HyperText Transfer Protocol',
    option_b: 'HyperText Transmission Process',
    option_c: 'Hyperlink Text Transfer Program',
    option_d: 'High Transfer Text Protocol',
    correct_option: 'A',
    explanation: 'HTTP stands for HyperText Transfer Protocol, the foundation of data communication on the World Wide Web.'
  },
  {
    unit_number: 1,
    unit_name: 'Unit I — Web Basics, HTML & CSS',
    topic: 'HTML Structure',
    difficulty: 'Easy',
    question_text: 'Which HTML tag serves as the main container for all visible content rendered on a web page?',
    option_a: '<head>',
    option_b: '<body>',
    option_c: '<html>',
    option_d: '<main>',
    correct_option: 'B',
    explanation: 'The <body> element contains all the visible contents of an HTML document, such as text, images, and links.'
  },
  {
    unit_number: 1,
    unit_name: 'Unit I — Web Basics, HTML & CSS',
    topic: 'CSS Overview',
    difficulty: 'Easy',
    question_text: 'Which CSS property is used to set the background color of an HTML element?',
    option_a: 'color',
    option_b: 'bgcolor',
    option_c: 'background-color',
    option_d: 'canvas-color',
    correct_option: 'C',
    explanation: 'The background-color CSS property sets the background color of an element.'
  },
  {
    unit_number: 1,
    unit_name: 'Unit I — Web Basics, HTML & CSS',
    topic: 'URL & Domain Name',
    difficulty: 'Easy',
    question_text: 'In the URL https://www.examforge.com/index.html, which segment represents the domain name?',
    option_a: 'www.examforge.com',
    option_b: 'https://',
    option_c: 'index.html',
    option_d: '/index.html',
    correct_option: 'A',
    explanation: 'www.examforge.com is the domain name (host identifier) of the web server in the URL.'
  },
  {
    unit_number: 1,
    unit_name: 'Unit I — Web Basics, HTML & CSS',
    topic: 'Git Version Control',
    difficulty: 'Easy',
    question_text: 'Which Git command creates a local copy of an existing remote repository on your computer?',
    option_a: 'git init',
    option_b: 'git clone',
    option_c: 'git pull',
    option_d: 'git checkout',
    correct_option: 'B',
    explanation: 'git clone copies an existing Git repository from a remote server to the local workspace.'
  },

  // MEDIUM
  {
    unit_number: 1,
    unit_name: 'Unit I — Web Basics, HTML & CSS',
    topic: 'Web Server vs Application Server',
    difficulty: 'Medium',
    question_text: 'What is the primary difference between a Web Server and an Application Server?',
    option_a: 'Web servers process database transactions while application servers serve static HTML files.',
    option_b: 'Web servers serve static HTTP content while application servers execute dynamic business logic and application APIs.',
    option_c: 'Web servers compile C code while application servers execute JavaScript.',
    option_d: 'Web servers require SSL certificates while application servers do not.',
    correct_option: 'B',
    explanation: 'Web servers handle HTTP requests and deliver static files, whereas Application Servers host dynamic business logic and enterprise services.'
  },
  {
    unit_number: 1,
    unit_name: 'Unit I — Web Basics, HTML & CSS',
    topic: 'HTML Semantic Elements',
    difficulty: 'Medium',
    question_text: 'Which HTML5 semantic element is designed for content that is tangentially related to the main content, such as a sidebar or callout box?',
    option_a: '<section>',
    option_b: '<article>',
    option_c: '<aside>',
    option_d: '<nav>',
    correct_option: 'C',
    explanation: 'The <aside> element represents a portion of a document whose content is indirectly related to the main page content.'
  },
  {
    unit_number: 1,
    unit_name: 'Unit I — Web Basics, HTML & CSS',
    topic: 'CSS Box Model',
    difficulty: 'Medium',
    question_text: 'In the CSS box model, which space is located directly between the element content and its border?',
    option_a: 'Padding',
    option_b: 'Margin',
    option_c: 'Outline',
    option_d: 'Gap',
    correct_option: 'A',
    explanation: 'Padding is the space between the content of an element and its border.'
  },
  {
    unit_number: 1,
    unit_name: 'Unit I — Web Basics, HTML & CSS',
    topic: 'CSS Selectors & Specificity',
    difficulty: 'Medium',
    question_text: 'Which CSS selector has the highest specificity when styling an element?',
    option_a: 'Element selector (p)',
    option_b: 'Class selector (.title)',
    option_c: 'Pseudo-class selector (:hover)',
    option_d: 'ID selector (#header)',
    correct_option: 'D',
    explanation: 'ID selectors (#id) have higher specificity weight (0,1,0,0) than class selectors (0,0,1,0) and element selectors (0,0,0,1).'
  },
  {
    unit_number: 1,
    unit_name: 'Unit I — Web Basics, HTML & CSS',
    topic: 'DNS & IP Addresses',
    difficulty: 'Medium',
    question_text: 'What is the primary function of a Domain Name System (DNS) server on the Internet?',
    option_a: 'Encrypting data packets transferred over SSL',
    option_b: 'Translating human-readable domain names into numerical IP addresses',
    option_c: 'Caching HTTP cookies for web browsers',
    option_d: 'Routing email messages between SMTP client and server',
    correct_option: 'B',
    explanation: 'DNS translates human-friendly domain names (e.g. example.com) to machine-readable IP addresses (e.g. 192.0.2.1).'
  },

  // HARD
  {
    unit_number: 1,
    unit_name: 'Unit I — Web Basics, HTML & CSS',
    topic: 'CSS Cascading & Specificity Calculation',
    difficulty: 'Hard',
    question_text: 'An element <p id="demo" class="text" style="color: red;"> receives styles: #demo { color: blue; } and .text { color: green; }. Which color will be rendered?',
    option_a: 'Red',
    option_b: 'Blue',
    option_c: 'Green',
    option_d: 'Black',
    correct_option: 'A',
    explanation: 'Inline styles defined in the HTML style attribute have a higher specificity (1,0,0,0) than ID selectors (0,1,0,0) or class selectors.'
  },
  {
    unit_number: 1,
    unit_name: 'Unit I — Web Basics, HTML & CSS',
    topic: 'CSS Box-Sizing Property',
    difficulty: 'Hard',
    question_text: 'If an element has width: 200px, padding: 20px, border: 5px solid black, and box-sizing: border-box, what is the width of the inner content area alone?',
    option_a: '200px',
    option_b: '175px',
    option_c: '150px',
    option_d: '250px',
    correct_option: 'C',
    explanation: 'With box-sizing: border-box, total width (200px) includes padding and border. Content width = 200 - 2*(20 padding) - 2*(5 border) = 150px.'
  },
  {
    unit_number: 1,
    unit_name: 'Unit I — Web Basics, HTML & CSS',
    topic: 'HTML Inline vs Block Elements',
    difficulty: 'Hard',
    question_text: 'Which of the following elements is an inline element by default and cannot contain block-level elements inside it under HTML specifications?',
    option_a: '<div>',
    option_b: '<span>',
    option_c: '<article>',
    option_d: '<section>',
    correct_option: 'B',
    explanation: '<span> is an inline container element. Inline elements cannot contain block-level elements.'
  },
  {
    unit_number: 1,
    unit_name: 'Unit I — Web Basics, HTML & CSS',
    topic: 'Cloud Computing Service Models',
    difficulty: 'Hard',
    question_text: 'Which cloud computing model provides a managed runtime platform, web server, and database layer allowing developers to deploy code without managing OS instances?',
    option_a: 'IaaS (Infrastructure as a Service)',
    option_b: 'SaaS (Software as a Service)',
    option_c: 'PaaS (Platform as a Service)',
    option_d: 'DaaS (Database as a Service)',
    correct_option: 'C',
    explanation: 'PaaS (Platform as a Service) supplies a complete hardware and software environment for building and deploying applications.'
  },
  {
    unit_number: 1,
    unit_name: 'Unit I — Web Basics, HTML & CSS',
    topic: 'Git Branching & Merging',
    difficulty: 'Hard',
    question_text: 'Which Git command integrates changes from a target branch into the current branch while creating a merge commit if fast-forward is not possible?',
    option_a: 'git merge <target-branch>',
    option_b: 'git rebase <target-branch>',
    option_c: 'git fetch --all',
    option_d: 'git push origin main',
    correct_option: 'A',
    explanation: 'git merge incorporates changes from the specified branch into the current checked-out branch.'
  },

  // ==========================================
  // UNIT II: CLIENT-SIDE PROGRAMMING — JAVASCRIPT (15 MCQs: 5 Easy, 5 Med, 5 Hard)
  // ==========================================
  // EASY
  {
    unit_number: 2,
    unit_name: 'Unit II — Client-Side JavaScript',
    topic: 'Variables & Declarations',
    difficulty: 'Easy',
    question_text: 'Which JavaScript keyword declares a block-scoped variable that cannot be re-declared in the same scope?',
    option_a: 'var',
    option_b: 'let',
    option_c: 'global',
    option_d: 'define',
    correct_option: 'B',
    explanation: 'let allows declaring block-scoped local variables, preventing re-declaration within the same scope.'
  },
  {
    unit_number: 2,
    unit_name: 'Unit II — Client-Side JavaScript',
    topic: 'DOM Manipulation',
    difficulty: 'Easy',
    question_text: 'Which document method selects an HTML element using its unique id attribute in JavaScript?',
    option_a: 'document.getElementById()',
    option_b: 'document.querySelectorID()',
    option_c: 'document.findId()',
    option_d: 'document.getElementByTag()',
    correct_option: 'A',
    explanation: 'document.getElementById() returns a reference to the element specified by its unique ID string.'
  },
  {
    unit_number: 2,
    unit_name: 'Unit II — Client-Side JavaScript',
    topic: 'Event Handler Attributes',
    difficulty: 'Easy',
    question_text: 'Which HTML attribute assigns a JavaScript handler when a user clicks a button?',
    option_a: 'onhover',
    option_b: 'onpress',
    option_c: 'onclick',
    option_d: 'onchange',
    correct_option: 'C',
    explanation: 'The onclick event attribute executes script code when the element is clicked.'
  },
  {
    unit_number: 2,
    unit_name: 'Unit II — Client-Side JavaScript',
    topic: 'Accessing Form Controls',
    difficulty: 'Easy',
    question_text: 'How do you get the value typed into a text input element <input id="username" type="text"> in JavaScript?',
    option_a: 'document.getElementById("username").text',
    option_b: 'document.getElementById("username").value',
    option_c: 'document.getElementById("username").getContent()',
    option_d: 'document.getElementById("username").innerHTML',
    correct_option: 'B',
    explanation: 'The .value property contains the current text value of an input element.'
  },
  {
    unit_number: 2,
    unit_name: 'Unit II — Client-Side JavaScript',
    topic: 'Loops',
    difficulty: 'Easy',
    question_text: 'Which loop guarantees that its block of code will execute at least once before evaluating its condition?',
    option_a: 'for loop',
    option_b: 'while loop',
    option_c: 'for...in loop',
    option_d: 'do...while loop',
    correct_option: 'D',
    explanation: 'A do...while loop executes the statement block once before checking if the condition is true.'
  },

  // MEDIUM
  {
    unit_number: 2,
    unit_name: 'Unit II — Client-Side JavaScript',
    topic: 'JavaScript Data Types',
    difficulty: 'Medium',
    question_text: 'What is the return value of evaluating typeof null in JavaScript?',
    option_a: '"null"',
    option_b: '"undefined"',
    option_c: '"object"',
    option_d: '"number"',
    correct_option: 'C',
    explanation: 'typeof null returns "object", which is a historical bug in JavaScript that remains for backward compatibility.'
  },
  {
    unit_number: 2,
    unit_name: 'Unit II — Client-Side JavaScript',
    topic: 'Event Listeners',
    difficulty: 'Medium',
    question_text: 'What is an advantage of element.addEventListener("click", handler) over element.onclick = handler?',
    option_a: 'addEventListener executes faster in Internet Explorer.',
    option_b: 'addEventListener allows attaching multiple listener functions to the same event on an element without overwriting existing ones.',
    option_c: 'addEventListener automatically prevents form submission.',
    option_d: 'onclick only works with inline HTML.',
    correct_option: 'B',
    explanation: 'addEventListener permits adding multiple event handlers to an event target without replacing existing listeners.'
  },
  {
    unit_number: 2,
    unit_name: 'Unit II — Client-Side JavaScript',
    topic: 'Form Validation',
    difficulty: 'Medium',
    question_text: 'In client-side JavaScript form validation, how can a submit event handler cancel form submission when input is invalid?',
    option_a: 'event.preventDefault()',
    option_b: 'event.stopPropagation()',
    option_c: 'return cancelSubmit()',
    option_d: 'document.stopForm()',
    correct_option: 'A',
    explanation: 'event.preventDefault() cancels the event if it is cancelable, preventing the default action (form submission) from occurring.'
  },
  {
    unit_number: 2,
    unit_name: 'Unit II — Client-Side JavaScript',
    topic: 'Canvas API',
    difficulty: 'Medium',
    question_text: 'Which method obtains the 2D drawing context needed to render graphics on an HTML5 <canvas> element?',
    option_a: 'canvas.get2DContext()',
    option_b: 'canvas.createContext("2d")',
    option_c: 'canvas.getContext("2d")',
    option_d: 'canvas.renderContext("2d")',
    correct_option: 'C',
    explanation: 'canvas.getContext("2d") returns a drawing context on the canvas, or null if context identifier is not supported.'
  },
  {
    unit_number: 2,
    unit_name: 'Unit II — Client-Side JavaScript',
    topic: 'JavaScript Objects',
    difficulty: 'Medium',
    question_text: 'How do you add a new property "age" with numeric value 20 to an object student = {}?',
    option_a: 'student.age = 20;',
    option_b: 'student.addProperty("age", 20);',
    option_c: 'student["age"] = new Property(20);',
    option_d: 'student.set("age", 20);',
    correct_option: 'A',
    explanation: 'Properties can be added to JavaScript objects using dot notation (student.age = 20) or bracket notation.'
  },

  // HARD
  {
    unit_number: 2,
    unit_name: 'Unit II — Client-Side JavaScript',
    topic: 'Closures & Scoping',
    difficulty: 'Hard',
    question_text: 'What will be logged to console by executing: for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 100); }?',
    option_a: '0 1 2',
    option_b: '1 2 3',
    option_c: '0 0 0',
    option_d: '3 3 3',
    correct_option: 'D',
    explanation: 'Because var is function-scoped, all callbacks reference the single binding of i which equals 3 after the loop finishes.'
  },
  {
    unit_number: 2,
    unit_name: 'Unit II — Client-Side JavaScript',
    topic: 'Type Coercion & Equality',
    difficulty: 'Hard',
    question_text: 'What is the boolean result of evaluating [] == ![] in JavaScript?',
    option_a: 'false',
    option_b: 'true',
    option_c: 'TypeError',
    option_d: 'NaN',
    correct_option: 'B',
    explanation: '![] evaluates to false. In abstract equality comparison [] == false, [] converts to "" and false to 0, resulting in 0 == 0 (true).'
  },
  {
    unit_number: 2,
    unit_name: 'Unit II — Client-Side JavaScript',
    topic: 'Event Propagation',
    difficulty: 'Hard',
    question_text: 'In DOM event propagation, which phase executes listeners registered on ancestor elements from top to bottom before reaching the target element?',
    option_a: 'Target phase',
    option_b: 'Bubbling phase',
    option_c: 'Capturing phase',
    option_d: 'Dispatching phase',
    correct_option: 'C',
    explanation: 'The capturing phase propagates the event down from the Window/Document through ancestors down to the target element.'
  },
  {
    unit_number: 2,
    unit_name: 'Unit II — Client-Side JavaScript',
    topic: 'Promises & Async JS',
    difficulty: 'Hard',
    question_text: 'What is the initial state of a JavaScript Promise object immediately after creation with new Promise((resolve, reject) => {})?',
    option_a: 'pending',
    option_b: 'fulfilled',
    option_c: 'rejected',
    option_d: 'settled',
    correct_option: 'A',
    explanation: 'A Promise is initially in the pending state until it is either resolved (fulfilled) or rejected.'
  },
  {
    unit_number: 2,
    unit_name: 'Unit II — Client-Side JavaScript',
    topic: 'Canvas API Drawing',
    difficulty: 'Hard',
    question_text: 'Which sequence of Canvas context calls correctly fills a blue rectangle at x=10, y=10 with width=100 and height=50?',
    option_a: 'ctx.drawRect(10, 10, 100, 50, "blue");',
    option_b: 'ctx.fillStyle = "blue"; ctx.fillRect(10, 10, 100, 50);',
    option_c: 'ctx.color = "blue"; ctx.rect(10, 10, 100, 50);',
    option_d: 'ctx.fill("blue"); ctx.addBox(10, 10, 100, 50);',
    correct_option: 'B',
    explanation: 'ctx.fillStyle sets the fill color, and ctx.fillRect(x, y, width, height) draws a filled rectangle.'
  },

  // ==========================================
  // UNIT III: SERVER-SIDE PROGRAMMING — PHP & BOOTSTRAP (15 MCQs: 5 Easy, 5 Med, 5 Hard)
  // ==========================================
  // EASY
  {
    unit_number: 3,
    unit_name: 'Unit III — Server-Side PHP & Bootstrap',
    topic: 'PHP Variables',
    difficulty: 'Easy',
    question_text: 'All variable names in PHP must begin with which special character?',
    option_a: '$',
    option_b: '@',
    option_c: '#',
    option_d: '&',
    correct_option: 'A',
    explanation: 'In PHP, variable names start with a dollar sign ($) followed by the variable name.'
  },
  {
    unit_number: 3,
    unit_name: 'Unit III — Server-Side PHP & Bootstrap',
    topic: 'PHP Output Statements',
    difficulty: 'Easy',
    question_text: 'Which PHP statement is commonly used to output text or HTML to the response stream?',
    option_a: 'print_line',
    option_b: 'write()',
    option_c: 'echo',
    option_d: 'console.log()',
    correct_option: 'C',
    explanation: 'echo is a PHP language construct used to output one or more strings.'
  },
  {
    unit_number: 3,
    unit_name: 'Unit III — Server-Side PHP & Bootstrap',
    topic: 'Bootstrap Grid System',
    difficulty: 'Easy',
    question_text: 'How many total columns are in a standard Bootstrap grid row layout?',
    option_a: '6',
    option_b: '12',
    option_c: '10',
    option_d: '16',
    correct_option: 'B',
    explanation: 'Bootstrap grid system allows up to 12 columns across a single row.'
  },
  {
    unit_number: 3,
    unit_name: 'Unit III — Server-Side PHP & Bootstrap',
    topic: 'PHP String Concatenation',
    difficulty: 'Easy',
    question_text: 'Which operator is used to concatenate two strings together in PHP?',
    option_a: '.',
    option_b: '+',
    option_c: '&',
    option_d: '->',
    correct_option: 'A',
    explanation: 'The dot operator (.) is the string concatenation operator in PHP.'
  },
  {
    unit_number: 3,
    unit_name: 'Unit III — Server-Side PHP & Bootstrap',
    topic: 'PHP File Handling',
    difficulty: 'Easy',
    question_text: 'Which built-in PHP function is used to open a file on the server?',
    option_a: 'file_get()',
    option_b: 'open_file()',
    option_c: 'fopen()',
    option_d: 'readfile_open()',
    correct_option: 'C',
    explanation: 'fopen() opens a file or a URL in PHP and returns a file pointer resource.'
  },

  // MEDIUM
  {
    unit_number: 3,
    unit_name: 'Unit III — Server-Side PHP & Bootstrap',
    topic: 'PHP Associative Arrays',
    difficulty: 'Medium',
    question_text: 'How do you create an associative array in PHP linking key "role" to value "admin"?',
    option_a: '$user = array("role" = "admin");',
    option_b: '$user = array("role" => "admin");',
    option_c: '$user = ["role": "admin"];',
    option_d: '$user = Map("role", "admin");',
    correct_option: 'B',
    explanation: 'Associative arrays in PHP use the key => value syntax (e.g. array("role" => "admin") or ["role" => "admin"]).'
  },
  {
    unit_number: 3,
    unit_name: 'Unit III — Server-Side PHP & Bootstrap',
    topic: 'PHP Form Handling & Superglobals',
    difficulty: 'Medium',
    question_text: 'Which superglobal array collects input values sent via HTTP POST method from an HTML form?',
    option_a: '$_POST',
    option_b: '$_GET',
    option_c: '$_REQUEST_BODY',
    option_d: '$_SERVER',
    correct_option: 'A',
    explanation: '$_POST is a PHP superglobal variable used to collect form data after submitting an HTML form with method="post".'
  },
  {
    unit_number: 3,
    unit_name: 'Unit III — Server-Side PHP & Bootstrap',
    topic: 'Bootstrap Breakpoints',
    difficulty: 'Medium',
    question_text: 'In Bootstrap grid layout, which class prefix targets medium-sized screen widths (tablets, >=768px)?',
    option_a: 'col-sm-',
    option_b: 'col-lg-',
    option_c: 'col-md-',
    option_d: 'col-xl-',
    correct_option: 'C',
    explanation: 'col-md- is the Bootstrap class prefix for medium devices (tablets, viewport width >= 768px).'
  },
  {
    unit_number: 3,
    unit_name: 'Unit III — Server-Side PHP & Bootstrap',
    topic: 'PHP PDO Database Prepared Statements',
    difficulty: 'Medium',
    question_text: 'Why are PDO prepared statements ($stmt = $pdo->prepare(...)) used for database access in PHP?',
    option_a: 'They convert SQL queries into JSON format.',
    option_b: 'They prevent SQL injection attacks by separating SQL code from user parameters.',
    option_c: 'They automatically encrypt database tables.',
    option_d: 'They bypass database authentication.',
    correct_option: 'B',
    explanation: 'Prepared statements protect against SQL injection because parameter values are transmitted separately from the query structure.'
  },
  {
    unit_number: 3,
    unit_name: 'Unit III — Server-Side PHP & Bootstrap',
    topic: 'PHP Sessions',
    difficulty: 'Medium',
    question_text: 'Which PHP function must be invoked before any HTML output is generated to initialize or resume a user session?',
    option_a: 'session_start()',
    option_b: 'session_init()',
    option_c: 'start_session()',
    option_d: 'create_session()',
    correct_option: 'A',
    explanation: 'session_start() starts a new session or resumes an existing session and must be called before headers/output are sent.'
  },

  // HARD
  {
    unit_number: 3,
    unit_name: 'Unit III — Server-Side PHP & Bootstrap',
    topic: 'PHP Static Variables in Functions',
    difficulty: 'Hard',
    question_text: 'What will be printed by executing function test() { static $count = 0; $count++; echo $count; } test(); test(); test();?',
    option_a: '1 1 1',
    option_b: '0 1 2',
    option_c: '1 2 3',
    option_d: '3 3 3',
    correct_option: 'C',
    explanation: 'A static variable inside a PHP function retains its value between function calls, outputting 1 2 3.'
  },
  {
    unit_number: 3,
    unit_name: 'Unit III — Server-Side PHP & Bootstrap',
    topic: 'PHP Pass by Reference',
    difficulty: 'Hard',
    question_text: 'How do you define a PHP function parameter so that modifications inside the function alter the original argument variable?',
    option_a: 'Prepend & before parameter name, e.g. function modify(&$var)',
    option_b: 'Prepend * before parameter name, e.g. function modify(*$var)',
    option_c: 'Use ref keyword, e.g. function modify(ref $var)',
    option_d: 'Set $var = &global;',
    correct_option: 'A',
    explanation: 'Prepending an ampersand (&) to a function argument definition passes it by reference.'
  },
  {
    unit_number: 3,
    unit_name: 'Unit III — Server-Side PHP & Bootstrap',
    topic: 'Bootstrap Flexbox Utilities',
    difficulty: 'Hard',
    question_text: 'Which Bootstrap utility class centers flex items vertically along the cross axis in a flexbox container?',
    option_a: 'justify-content-center',
    option_b: 'align-items-center',
    option_c: 'flex-center',
    option_d: 'align-content-middle',
    correct_option: 'B',
    explanation: 'align-items-center uses CSS align-items: center to align flex items vertically.'
  },
  {
    unit_number: 3,
    unit_name: 'Unit III — Server-Side PHP & Bootstrap',
    topic: 'PHP File Inclusion (include vs require)',
    difficulty: 'Hard',
    question_text: 'What is the exact behavioral difference between include "file.php" and require "file.php" when file.php does not exist?',
    option_a: 'include halts execution while require ignores the error.',
    option_b: 'Both throw fatal errors.',
    option_c: 'include throws a fatal error while require logs a warning.',
    option_d: 'include emits a warning (E_WARNING) and script continues; require produces a fatal error (E_COMPILE_ERROR) and script execution stops.',
    correct_option: 'D',
    explanation: 'require produces a fatal error and stops script execution, while include produces a warning and script continues execution.'
  },
  {
    unit_number: 3,
    unit_name: 'Unit III — Server-Side PHP & Bootstrap',
    topic: 'PHP PDO Error Modes',
    difficulty: 'Hard',
    question_text: 'Which attribute setting configures PDO to throw exceptions whenever database errors occur?',
    option_a: '$pdo->setErrorMode(ERRMODE_EXCEPTION);',
    option_b: '$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);',
    option_c: '$pdo->enableExceptions(true);',
    option_d: '$pdo->config["exceptions"] = true;',
    correct_option: 'B',
    explanation: 'Setting PDO::ATTR_ERRMODE to PDO::ERRMODE_EXCEPTION forces PDO to throw PDOException on database errors.'
  },

  // ==========================================
  // UNIT IV: REACTJS (15 MCQs: 5 Easy, 5 Med, 5 Hard)
  // ==========================================
  // EASY
  {
    unit_number: 4,
    unit_name: 'Unit IV — ReactJS Basics & Architecture',
    topic: 'React Overview',
    difficulty: 'Easy',
    question_text: 'What is ReactJS primarily designed for in web development?',
    option_a: 'Building user interfaces for single-page applications using reusable components',
    option_b: 'Managing relational SQL databases on server',
    option_c: 'Parsing CSS styles into SCSS syntax',
    option_d: 'Handling server-side DNS resolution',
    correct_option: 'A',
    explanation: 'React is a JavaScript library created by Meta for building user interfaces based on components.'
  },
  {
    unit_number: 4,
    unit_name: 'Unit IV — ReactJS Basics & Architecture',
    topic: 'JSX Syntax',
    difficulty: 'Easy',
    question_text: 'In JSX syntax, which attribute replaces standard HTML "class" to prevent conflict with JavaScript reserved keywords?',
    option_a: 'classID',
    option_b: 'className',
    option_c: 'styleClass',
    option_d: 'cssClass',
    correct_option: 'B',
    explanation: 'JSX uses className instead of class because class is a reserved keyword in JavaScript.'
  },
  {
    unit_number: 4,
    unit_name: 'Unit IV — ReactJS Basics & Architecture',
    topic: 'React Components',
    difficulty: 'Easy',
    question_text: 'What must a React functional component return to describe its UI?',
    option_a: 'A string representation of HTML',
    option_b: 'A Promise object',
    option_c: 'JSX elements / React elements',
    option_d: 'A DOM Node object',
    correct_option: 'C',
    explanation: 'React functional components return JSX elements describing what should appear on the screen.'
  },
  {
    unit_number: 4,
    unit_name: 'Unit IV — ReactJS Basics & Architecture',
    topic: 'Virtual DOM',
    difficulty: 'Easy',
    question_text: 'What is the primary performance benefit of React Virtual DOM?',
    option_a: 'It replaces HTML with WebAssembly.',
    option_b: 'It minimizes expensive real DOM manipulation by computing UI diffs in memory.',
    option_c: 'It caches images in browser local storage.',
    option_d: 'It eliminates the need for JavaScript.',
    correct_option: 'B',
    explanation: 'The Virtual DOM keeps a lightweight copy of the DOM in memory, diffing changes to minimize direct DOM updates.'
  },
  {
    unit_number: 4,
    unit_name: 'Unit IV — ReactJS Basics & Architecture',
    topic: 'React Native vs ReactJS',
    difficulty: 'Easy',
    question_text: 'What is the primary target environment of React Native compared to ReactJS?',
    option_a: 'Web Browsers (Chrome, Firefox)',
    option_b: 'Desktop Applications for Electron',
    option_c: 'Native Mobile Applications (iOS and Android)',
    option_d: 'Embedded Linux Microcontrollers',
    correct_option: 'C',
    explanation: 'React Native targets mobile platforms (iOS & Android) rendering native UI components, while ReactJS targets web browsers.'
  },

  // MEDIUM
  {
    unit_number: 4,
    unit_name: 'Unit IV — ReactJS Basics & Architecture',
    topic: 'JSX Embedding Expressions',
    difficulty: 'Medium',
    question_text: 'How do you embed a JavaScript expression inside JSX syntax?',
    option_a: 'Wrap it in single curly braces { expression }',
    option_b: 'Wrap it in double quotes "expression"',
    option_c: 'Use <% expression %>',
    option_d: 'Use {{ expression }}',
    correct_option: 'A',
    explanation: 'In JSX, any valid JavaScript expression can be embedded inside single curly braces {}.'
  },
  {
    unit_number: 4,
    unit_name: 'Unit IV — ReactJS Basics & Architecture',
    topic: 'Class Component Lifecycle',
    difficulty: 'Medium',
    question_text: 'In React class components, which lifecycle method runs immediately after a component is mounted into the DOM?',
    option_a: 'componentWillMount()',
    option_b: 'componentDidMount()',
    option_c: 'componentDidUpdate()',
    option_d: 'render()',
    correct_option: 'B',
    explanation: 'componentDidMount() is invoked immediately after a component is mounted into the DOM tree.'
  },
  {
    unit_number: 4,
    unit_name: 'Unit IV — ReactJS Basics & Architecture',
    topic: 'React Fragment',
    difficulty: 'Medium',
    question_text: 'Why is <React.Fragment> or shorthand <> </> used in React rendering?',
    option_a: 'To style elements with CSS grid.',
    option_b: 'To enable automatic state persistence.',
    option_c: 'To group a list of children without adding extra wrapper nodes to the DOM.',
    option_d: 'To create shadow DOM boundaries.',
    correct_option: 'C',
    explanation: 'React Fragments let you group a list of children without adding extra div nodes to the DOM.'
  },
  {
    unit_number: 4,
    unit_name: 'Unit IV — ReactJS Basics & Architecture',
    topic: 'React Class Component State API',
    difficulty: 'Medium',
    question_text: 'How do class components update local component state and schedule a re-render?',
    option_a: 'this.state.count = 5;',
    option_b: 'this.setState({ count: 5 });',
    option_c: 'this.updateState({ count: 5 });',
    option_d: 'React.forceRender();',
    correct_option: 'B',
    explanation: 'this.setState() enqueues changes to the component state and tells React to re-render the component and its children.'
  },
  {
    unit_number: 4,
    unit_name: 'Unit IV — ReactJS Basics & Architecture',
    topic: 'React Keys in Lists',
    difficulty: 'Medium',
    question_text: 'Why are key props required when rendering arrays of dynamic list items in React?',
    option_a: 'Keys help React identify which items have changed, been added, or removed for efficient DOM reconciliation.',
    option_b: 'Keys automatically sort array items alphabetically.',
    option_c: 'Keys encrypt array data in state.',
    option_d: 'Keys allow inline CSS styling.',
    correct_option: 'A',
    explanation: 'Keys give elements a stable identity so React can reconcile DOM nodes efficiently when lists change.'
  },

  // HARD
  {
    unit_number: 4,
    unit_name: 'Unit IV — ReactJS Basics & Architecture',
    topic: 'React Reconciliation Algorithm',
    difficulty: 'Hard',
    question_text: 'How does React Reconciliation diffing algorithm achieve O(n) heuristic complexity for tree comparisons?',
    option_a: 'By comparing every node with every other node recursively.',
    option_b: 'By ignoring parent components and comparing only text nodes.',
    option_c: 'By assuming elements of different types generate different trees and utilizing stable keys for list children.',
    option_d: 'By converting JSX to WebGL shaders.',
    correct_option: 'C',
    explanation: 'React relies on two heuristics: two elements of different types produce different trees, and developers can hint at stable elements across renders with a key prop.'
  },
  {
    unit_number: 4,
    unit_name: 'Unit IV — ReactJS Basics & Architecture',
    topic: 'Class Component Cleanup Lifecycle',
    difficulty: 'Hard',
    question_text: 'Which class component lifecycle method must be used to perform cleanup operations like invalidating timers or canceling network requests?',
    option_a: 'componentDidCatch()',
    option_b: 'componentWillUnmount()',
    option_c: 'getDerivedStateFromProps()',
    option_d: 'shouldComponentUpdate()',
    correct_option: 'B',
    explanation: 'componentWillUnmount() is invoked immediately before a component is unmounted and destroyed, suitable for cleanup.'
  },
  {
    unit_number: 4,
    unit_name: 'Unit IV — ReactJS Basics & Architecture',
    topic: 'Class Constructor & Super',
    difficulty: 'Hard',
    question_text: 'Why must super(props) be called as the first line in a React class component constructor?',
    option_a: 'To initialize this.props on the parent React.Component constructor before accessing this in child constructor.',
    option_b: 'To register the component with React DevTools.',
    option_c: 'To compile JSX code.',
    option_d: 'To trigger initial render.',
    correct_option: 'A',
    explanation: 'Calling super(props) passes props to the base React.Component constructor so that this.props is defined inside the constructor.'
  },
  {
    unit_number: 4,
    unit_name: 'Unit IV — ReactJS Basics & Architecture',
    topic: 'Synthetic Events',
    difficulty: 'Hard',
    question_text: 'What is a React SyntheticEvent object passed to event handlers?',
    option_a: 'A native browser DOM event directly.',
    option_b: 'A cross-browser wrapper around the native browser event providing uniform cross-platform event properties.',
    option_c: 'A JSON payload sent over WebSocket.',
    option_d: 'A Redux action object.',
    correct_option: 'B',
    explanation: 'SyntheticEvent is a cross-browser wrapper around the browser native event with the same interface, working identically across browsers.'
  },
  {
    unit_number: 4,
    unit_name: 'Unit IV — ReactJS Basics & Architecture',
    topic: 'React Fiber Architecture',
    difficulty: 'Hard',
    question_text: 'What was the core architectural objective of introducing React Fiber in React 16?',
    option_a: 'Replacing JavaScript with TypeScript.',
    option_b: 'Removing Virtual DOM.',
    option_c: 'Disabling class components.',
    option_d: 'Enabling incremental rendering, allowing React to pause, reuse, or prioritize work based on frame rates.',
    correct_option: 'D',
    explanation: 'React Fiber is a reimplementation of React core algorithm enabling asynchronous, incremental rendering and work prioritization.'
  },

  // ==========================================
  // UNIT V: REACT DATAFLOW, HOOKS & ROUTING (15 MCQs: 5 Easy, 5 Med, 5 Hard)
  // ==========================================
  // EASY
  {
    unit_number: 5,
    unit_name: 'Unit V — React Dataflow, Hooks & Routing',
    topic: 'React Props',
    difficulty: 'Easy',
    question_text: 'How is data passed from a parent component down to a child component in React?',
    option_a: 'Via props',
    option_b: 'Via state',
    option_c: 'Via cookies',
    option_d: 'Via session storage',
    correct_option: 'A',
    explanation: 'Props (short for properties) are inputs passed from parent to child components in React.'
  },
  {
    unit_number: 5,
    unit_name: 'Unit V — React Dataflow, Hooks & Routing',
    topic: 'useState Hook',
    difficulty: 'Easy',
    question_text: 'Which built-in React hook declares a state variable inside a functional component?',
    option_a: 'useRef',
    option_b: 'useState',
    option_c: 'useMemo',
    option_d: 'useReducer',
    correct_option: 'B',
    explanation: 'useState is a React Hook that lets you add state variables to functional components.'
  },
  {
    unit_number: 5,
    unit_name: 'Unit V — React Dataflow, Hooks & Routing',
    topic: 'useEffect Hook',
    difficulty: 'Easy',
    question_text: 'Which hook performs side effects like fetching data or setting up subscriptions in functional components?',
    option_a: 'useLayout',
    option_b: 'useCallback',
    option_c: 'useEffect',
    option_d: 'useContext',
    correct_option: 'C',
    explanation: 'useEffect lets you perform side effects in functional components.'
  },
  {
    unit_number: 5,
    unit_name: 'Unit V — React Dataflow, Hooks & Routing',
    topic: 'React Router Link',
    difficulty: 'Easy',
    question_text: 'Which react-router-dom component creates client-side navigation links without causing a full page refresh?',
    option_a: '<a href="...">',
    option_b: '<Link to="...">',
    option_c: '<Navigate path="...">',
    option_d: '<Route link="...">',
    correct_option: 'B',
    explanation: '<Link> allows the user to navigate to another page by clicking on it without refreshing the document.'
  },
  {
    unit_number: 5,
    unit_name: 'Unit V — React Dataflow, Hooks & Routing',
    topic: 'Props Immutability',
    difficulty: 'Easy',
    question_text: 'Are props mutable or read-only inside the component receiving them?',
    option_a: 'Read-only (Immutable)',
    option_b: 'Mutable',
    option_c: 'Write-only',
    option_d: 'Static global',
    correct_option: 'A',
    explanation: 'All React components must act like pure functions with respect to their props; props are read-only.'
  },

  // MEDIUM
  {
    unit_number: 5,
    unit_name: 'Unit V — React Dataflow, Hooks & Routing',
    topic: 'PropTypes Validation',
    difficulty: 'Medium',
    question_text: 'How do you specify using prop-types that a prop named "title" must be a required string?',
    option_a: 'title: PropTypes.string.required',
    option_b: 'title: PropTypes.string.isRequired',
    option_c: 'title: Types.String.Required',
    option_d: 'title: String.isRequired',
    correct_option: 'B',
    explanation: 'PropTypes.string.isRequired checks that the prop is a string and that it is provided.'
  },
  {
    unit_number: 5,
    unit_name: 'Unit V — React Dataflow, Hooks & Routing',
    topic: 'useEffect Dependency Array',
    difficulty: 'Medium',
    question_text: 'What happens if you pass an empty array [] as the second argument to useEffect(effect, [])?',
    option_a: 'The effect runs on every single re-render.',
    option_b: 'The effect runs only once after the initial component mount.',
    option_c: 'The effect never executes.',
    option_d: 'The effect runs continuously in an infinite loop.',
    correct_option: 'B',
    explanation: 'An empty dependency array [] tells React that the effect does not depend on any state or props, so it runs only on mount.'
  },
  {
    unit_number: 5,
    unit_name: 'Unit V — React Dataflow, Hooks & Routing',
    topic: 'React Router useParams',
    difficulty: 'Medium',
    question_text: 'Which react-router-dom hook returns an object containing route parameter key/value pairs from current URL (e.g. /users/:id)?',
    option_a: 'useParams()',
    option_b: 'useRoute()',
    option_c: 'useQueryParams()',
    option_d: 'useLocation()',
    correct_option: 'A',
    explanation: 'useParams returns an object of key/value pairs of dynamic params from the current URL matched by the <Route path>.'
  },
  {
    unit_number: 5,
    unit_name: 'Unit V — React Dataflow, Hooks & Routing',
    topic: 'React Context API (useContext)',
    difficulty: 'Medium',
    question_text: 'Which React hook allows a component to consume values provided by a React Context Provider without prop drilling?',
    option_a: 'useProvider()',
    option_b: 'useStore()',
    option_c: 'useContext()',
    option_d: 'useGlobal()',
    correct_option: 'C',
    explanation: 'useContext accepts a context object and returns the current context value for that context.'
  },
  {
    unit_number: 5,
    unit_name: 'Unit V — React Dataflow, Hooks & Routing',
    topic: 'useRef Hook',
    difficulty: 'Medium',
    question_text: 'What is a primary use case for the useRef hook in React functional components?',
    option_a: 'Triggering component re-renders when state changes.',
    option_b: 'Directly accessing underlying DOM elements or storing mutable values that do not trigger re-renders when updated.',
    option_c: 'Creating Redux store reducers.',
    option_d: 'Fetching data from REST APIs automatically.',
    correct_option: 'B',
    explanation: 'useRef returns a mutable ref object whose .current property persists across renders without causing re-renders when changed.'
  },

  // HARD
  {
    unit_number: 5,
    unit_name: 'Unit V — React Dataflow, Hooks & Routing',
    topic: 'React Memoization (useCallback vs useMemo)',
    difficulty: 'Hard',
    question_text: 'What is the fundamental difference between useCallback and useMemo hooks?',
    option_a: 'useCallback memoizes a callback function instance, while useMemo memoizes the result of executing a calculation function.',
    option_b: 'useCallback only works in class components.',
    option_c: 'useMemo cannot accept a dependency array.',
    option_d: 'There is no difference; they are aliases.',
    correct_option: 'A',
    explanation: 'useCallback(fn, deps) is equivalent to useMemo(() => fn, deps). useCallback memoizes functions, while useMemo memoizes computed values.'
  },
  {
    unit_number: 5,
    unit_name: 'Unit V — React Dataflow, Hooks & Routing',
    topic: 'Rules of React Hooks',
    difficulty: 'Hard',
    question_text: 'What are the two mandatory Rules of Hooks in React?',
    option_a: 'Call hooks inside loops, and call hooks inside class methods.',
    option_b: 'Call hooks only in event handlers, and call hooks asynchronously.',
    option_c: 'Only call hooks at the top level of React functions (not inside loops/conditions), and only call hooks from React function components or custom hooks.',
    option_d: 'Always pass a callback to hooks, and export all hooks from index.js.',
    correct_option: 'C',
    explanation: 'Hooks must be called at the top level of React function components/custom hooks to ensure hooks call order remains identical across renders.'
  },
  {
    unit_number: 5,
    unit_name: 'Unit V — React Dataflow, Hooks & Routing',
    topic: 'Controlled vs Uncontrolled Components',
    difficulty: 'Hard',
    question_text: 'What defines a Controlled Component in React form handling?',
    option_a: 'A form element whose value is managed by the DOM via document.getElementById.',
    option_b: 'A form input element whose displayed value is driven by React state and updated via state handler functions.',
    option_c: 'A component with disabled input fields.',
    option_d: 'A form component protected by JWT.',
    correct_option: 'B',
    explanation: 'In a controlled component, form data is handled by a React component state, making state the single source of truth.'
  },
  {
    unit_number: 5,
    unit_name: 'Unit V — React Dataflow, Hooks & Routing',
    topic: 'React Router Programmatic Navigation',
    difficulty: 'Hard',
    question_text: 'How do you programmatically navigate a user to "/dashboard" inside a submit handler in React Router v6?',
    option_a: 'const navigate = useNavigate(); navigate("/dashboard");',
    option_b: 'this.props.history.push("/dashboard");',
    option_c: 'useHistory().redirect("/dashboard");',
    option_d: 'window.location.router("/dashboard");',
    correct_option: 'A',
    explanation: 'React Router v6 uses the useNavigate hook, returning a navigate function to redirect programmatically.'
  },
  {
    unit_number: 5,
    unit_name: 'Unit V — React Dataflow, Hooks & Routing',
    topic: 'React State Batching & Functional Updates',
    difficulty: 'Hard',
    question_text: 'If count is 0 and an event handler executes setCount(count + 1) and setCount(count + 1) in sequence, what is the resulting count state, and how is it corrected?',
    option_a: 'Result is 2; no fix needed.',
    option_b: 'Result is 0; fix by calling React.flushSync().',
    option_c: 'Result is 1 due to state batching; fixed by using functional state updates: setCount(c => c + 1).',
    option_d: 'Result throws TypeError.',
    correct_option: 'C',
    explanation: 'State updates in the same tick use the captured count value (0+1=1). Using functional updates (setCount(prev => prev + 1)) ensures sequential updates sum to 2.'
  }
];

async function seed() {
  const connection = await db.promise().getConnection();
  try {
    console.log('--- SEEDING 75 WEB PROGRAMMING PRACTICE QUESTIONS ---');

    // Step 1: Create web_programming_questions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS web_programming_questions (
        question_id INT AUTO_INCREMENT PRIMARY KEY,
        unit_number INT NOT NULL,
        unit_name VARCHAR(100) NOT NULL,
        topic VARCHAR(250) NOT NULL,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_option ENUM('A','B','C','D') NOT NULL,
        explanation TEXT NOT NULL,
        difficulty ENUM('Easy','Medium','Hard') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    // Step 2: Create web_programming_practice_attempts table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS web_programming_practice_attempts (
        attempt_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        unit_number INT NULL,
        unit_name VARCHAR(100) NOT NULL,
        difficulty VARCHAR(50) NOT NULL,
        question_count INT NOT NULL,
        timer_seconds INT NULL,
        score DECIMAL(5,2) DEFAULT 0,
        correct_answers INT DEFAULT 0,
        total_questions INT DEFAULT 0,
        time_taken_seconds INT DEFAULT 0,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        KEY user_id (user_id),
        CONSTRAINT web_prog_attempts_fk1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    // Step 3: Create web_programming_practice_attempt_questions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS web_programming_practice_attempt_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        attempt_id INT NOT NULL,
        question_id INT NOT NULL,
        selected_option ENUM('A','B','C','D') NULL,
        is_correct TINYINT(1) DEFAULT 0,
        KEY attempt_id (attempt_id),
        KEY question_id (question_id),
        CONSTRAINT web_prog_att_q_fk1 FOREIGN KEY (attempt_id) REFERENCES web_programming_practice_attempts (attempt_id) ON DELETE CASCADE,
        CONSTRAINT web_prog_att_q_fk2 FOREIGN KEY (question_id) REFERENCES web_programming_questions (question_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    // Step 4: Clear existing questions & insert all 75 questions
    await connection.query('DELETE FROM web_programming_questions');
    await connection.query('ALTER TABLE web_programming_questions AUTO_INCREMENT = 1');

    for (const q of questionsData) {
      await connection.query(
        `INSERT INTO web_programming_questions 
         (unit_number, unit_name, topic, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [q.unit_number, q.unit_name, q.topic, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.explanation, q.difficulty]
      );
    }

    // Step 5: Verify seeding stats
    const [unitCounts] = await connection.query(
      'SELECT unit_number, unit_name, COUNT(*) as cnt FROM web_programming_questions GROUP BY unit_number, unit_name ORDER BY unit_number'
    );
    console.log('Questions Per Unit:', unitCounts);

    const [diffCounts] = await connection.query(
      'SELECT difficulty, COUNT(*) as cnt FROM web_programming_questions GROUP BY difficulty'
    );
    console.log('Questions Per Difficulty:', diffCounts);

    const [total] = await connection.query('SELECT COUNT(*) as total FROM web_programming_questions');
    console.log('TOTAL WEB PROGRAMMING QUESTIONS SEEDED:', total[0].total);

  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    connection.release();
    process.exit();
  }
}

seed();
