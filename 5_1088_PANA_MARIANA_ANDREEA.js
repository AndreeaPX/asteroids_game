// utilizez un obiect de tip canvas pentru a putea realiza jocul
const canv = document.getElementById("canvasGame");
//context grafic de desenare bidimensionala
const context = canv.getContext("2d");
//functie prin care am aplicat fundalul jocului = > imaginea se gaseste in folderul media
function createBackground() {
    baseImage = new Image();//imaginea de baza a jocului
    baseImage.src = "media/background.jpg";
    context.drawImage(baseImage, 0, 0);
}
const fps = 30; //frames per second
//frecventa obisnuita a fisierelor video este de 30 cadrane pe secunda
const VITEZA_AST = 75; //viteza maxima de deplasare a asteroizilor in pixeli pe sec
const DIM_AST = 100;//dim max a asteroizilor in pixeli
const DIM_RACHETA = 30;//dimensiunea rachetei in pixeli
const VITEZA_ROTIRE = 360; //viteza de rotire pe sec a rachetei
const THRUST = 7; //acceleratia rachetei in pixeli pe secunda
const NR_ASTEROIZI = 10; //nr initial de asteroizi -> daca se mareste dificultatea, vom creste si nr asteroizilor cu nivel*2+nr
const SHOW_CIRCLE = false; //cerc pentru tot => asteroizi si racheta -> daca cercul rachetei se atinge de asteroid => explozie
const TIMP_EXPLOZIE = 0.4; //timpul de explozie al rachetei in sec
const TIMP_REFACERE = 3; //timpul de refacere al navei in secunde
const TIMP_BLINK = 0.1; //timpul de blink al navei pana la refacere totala, in sec
const MAX_LASERE = 3; //nr maxim de lasere pe ecran simultan
const VITEZA_LASER = 600;//viteza laserelor in pixeli pe sec
const DIST_LASER = 0.5; //distanta maxima pe care un laser poate sa o parcurga, ca fractiune din latimea(w) ecranului 
const TEXT_TIME = 2.3; //timpul de disparitie al textului in sec
const VIETI = 5;//nr vieti initial
//scoruri pentru fiecare asteriod
const SCOR_ASTEROID_4 = 40;
const SCOR_ASTEROID_3 = 30;
const SCOR_ASTEROID_2 = 20;
const SCOR_ASTEROID_1 = 10;
const SAVE_KEY = "scor";//cheia de salvare a scorurilor
let PRAG_REGENERARE = 100; //pragul de regenerare al vietii initiale 

//creare parametrii joc
let level, vieti, scor, scorH, asteroizi, racheta, text, transparentaText;
newGame();



//event handlers 0
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);
//creare miscari racheta 0
let sus = false;
let stanga = false;
let dreapta = false;
let jos = false;

//am utilizat functia setInterval() pentru a rula jocul -> 1000/fps(=30) este pragul optim estimat pentru jocuri de mare viteza
setInterval(update, 1000 / fps);

//functia care creeaza asteroizii pentru fiecare nivel
function createAstoroid() {
    asteroizi = [];//initial nu avem niciun asteroid
    let x, y;
    //nr de asteroizi este influentat de nivel
    for (let i = 0; i < NR_ASTEROIZI + level * 2; i++) {
        do {
            //coordonatele de aparitie a asteroizilor sunt intotdeauna aleatoare
            x = Math.floor(Math.random() * canv.width);
            y = Math.floor(Math.random() * canv.height);
        } while ((distantaDintreCoordonate(racheta.x, racheta.y, x, y) < DIM_AST * 2 + racheta.r));
        //prin acest while ma asigur ca asteroizii generati de fiecare data la inceput de nivel sunt la o departare de cel putin dim_ast*2+raza racheta fata de racheta
        //madaugam asteroizi prin functia newAsteroid
        asteroizi.push(newAsteroid(x, y));
    }
}


//functie prin care este controlat procesul de transformare si distrugere al asteroizilor + calculare scor + verificare scor + incrementare nivel atunci cand toti asteroizii au fost distrusi
function distrugeAsteroid(i) {
    let an = asteroizi[i].n;
    //in functie de numarul n atribuit in mod aleator fiecarui asteroid, schimbam dimensiunea si culoarea acestuia
    if (an === 4) {
        asteroizi[i].r = 45;
        asteroizi[i].n = 3;
        scor += SCOR_ASTEROID_4;
    } else if (an === 3) {
        asteroizi[i].r = 35;
        asteroizi[i].n = 2;
        scor += SCOR_ASTEROID_3;
    } else if (an === 2) {
        asteroizi[i].r = 15;
        asteroizi[i].n = 1;
        scor += SCOR_ASTEROID_2;
    }
    else {
        asteroizi.splice(i, 1);
        scor += SCOR_ASTEROID_1;
    }

    //actualizarea scorului cel mai mare
    if (scor > scorH) {
        scorH = scor;
        localStorage.setItem(SAVE_KEY, scorH);
    }

    actualizareVieti(scor);
    //trecere la urmatorul nivel doar daca toti asteroizii au fost distrusi
    if (asteroizi.length == 0) {
        level++;
        newLevel();
    }
}


//functie de actualizare al numarului de vieti -> daca se atinge pragul 
function actualizareVieti(scor) {

    //pragul este actualizat chiar daca numarul de vieti este maxim
    if (scor >= PRAG_REGENERARE && vieti == VIETI) {
        PRAG_REGENERARE += 300;
    }

    if (scor >= PRAG_REGENERARE && vieti < VIETI) { //maresc nr de vieti doar daca nu este deja 5 = maxim
        vieti++;
        PRAG_REGENERARE += 300; //vietile se regenereaza din 300 in 300 de puncte aproximativ (poate sa fie mai mult scorul, adica daca ai pierdut o viata si sari de la 270 la 310, se mareste nr de vieti)
    }
}

//calcularea distantei dintre doua puncte exprimate de coordonatele acestora
function distantaDintreCoordonate(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

//functie prin care desenez vietile reprezentate ca rachete
function drawIconShip(x, y, u) {
    context.strokeStyle = "white";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo( //varful rachetei
        x + 4 / 3 * racheta.r * Math.cos(u),
        y - 4 / 3 * racheta.r * Math.sin(u)
    );

    context.lineTo( //linia spre stanga
        x - racheta.r * (2 / 3 * Math.cos(u) + Math.sin(u)),
        y + racheta.r * (2 / 3 * Math.sin(u) - Math.cos(u))
    );

    context.lineTo( //linia spre dreapta
        x - racheta.r * (2 / 3 * Math.cos(u) - Math.sin(u)),
        y + racheta.r * (2 / 3 * Math.sin(u) + Math.cos(u))
    );
    context.closePath();
    context.stroke();
}

//functie care seteaza timpul de explozie si explozia in sine la coliziunea rachetei cu un asteroid
//apelata la miscare racheta din update
function explozie() {

    racheta.timpExplozie = Math.ceil(TIMP_EXPLOZIE * fps);
}

//final de joc -> daca racheta => done = true
function gameOver() {
    racheta.done = true;
    text = "GAME OVER";
    transparentaText = 1.0; //textul apare pe ecran
}

//control tastatura
function keyDown(ev) {

    if (racheta.done) {
        return;
    }

    switch (ev.keyCode) {
        //37 = sageata stanga
        case 37:
            stanga = true;
            racheta.thrusting = true;
            break;
        //38 = sageata sus
        case 38:
            sus = true;
            racheta.thrusting = true;
            break;
        //sageata dreapta
        case 39:
            dreapta = true;
            racheta.thrusting = true;
            break;
        //sageata jos
        case 40:
            jos = true;
            racheta.thrusting = true;
            break;
        //z = rotire stanga
        case 90:
            racheta.rotatie = VITEZA_ROTIRE / 180 * Math.PI / fps;
            break;
        // c = rotire dreaprta
        case 67:
            racheta.rotatie = -VITEZA_ROTIRE / 180 * Math.PI / fps;
            break;
        //88 = x = lasere
        case 88:
            shootLaser();
            break;
    }
}

//control tastatura
function keyUp(ev) {
    if (racheta.done) {
        return;
    }
    switch (ev.keyCode) {
        //37 = sageata stanga
        case 37:
            racheta.thrusting = false;
            stanga = false;
            break;
        //38 = sageata sus
        case 38:
            racheta.thrusting = false;
            sus = false;
            break;
        //sageata dreapta
        case 39:
            racheta.thrusting = false;
            dreapta = false;
            break;
        //sageata jos
        case 40:
            racheta.thrusting = false;
            jos = false;
            break;
        //z = rotire stanga
        case 90:
            racheta.rotatie = 0;
            break;
        // c = rotire dreaprta
        case 67:
            racheta.rotatie = 0;
            break;
        //88 = x = lasere => aic o sa dam voie sa traga din nou
        case 88:
            racheta.shoot = true;
            break;
    }
}

//functie de creare a unui nou asteroid
function newAsteroid(x, y) {
    let lvlSpeed = 1 + 0.2 * level; //cu cat crestem nivelul, cu atat crestem si viteza asteroizilor
    let asteroid = {
        x: x,
        y: y,
        xv: Math.random() * VITEZA_AST * lvlSpeed / fps * (Math.random() < 0.5 ? 1 : -1),//mi s-a cerut de la inceput ca asteroizii sa aiba viteza si directie random
        yv: Math.random() * VITEZA_AST * lvlSpeed / fps * (Math.random() < 0.5 ? 1 : -1),
        r: DIM_AST / 2,//initial toti pot fi de 4
        u: Math.random() * Math.PI * 2,//360*(0,1)
        n: Math.floor(Math.random() * 4) + 1 //numere random de la 1 la 4 => nr de rachete necesare pt distrugere + culoarea asteroidului
    };
    return asteroid;
}

//functie de determinare a marimii si culorii asteroizilor
function asteroidColor(i) {
    context.lineWidth = 2;
    let asteroid_ = asteroizi[i];
    if (asteroid_.n === 1) {
        context.strokeStyle = "red";
        asteroid_.r = 15;
    } else if (asteroid_.n === 2) {
        context.strokeStyle = "blue";
        asteroid_.r = 35;
    } else if (asteroid_.n === 3) {
        context.strokeStyle = "magenta";
        asteroid_.r = 45;
    }
    else if (asteroid_.n === 4) {
        context.strokeStyle = "green";
    }
}

function createRacheta() {
    return {
        x: canv.width / 2,
        y: canv.height / 2,
        //(x,y) -> centrul canvasului
        //r = radius -> r/2 => centrul rachetei
        r: DIM_RACHETA / 2,
        //u este pentru unghiul de pointare al rachetei --> adica incotro este varful rachetei cand aplicatia porneste
        //aparent nu se poate exprima direct in grade (adica nu am putut pune 90, ca sa pointeze in sus), asa ca trebuie sa fie calculat in radius -> adica pi/2 = 90 grade
        u: 1 / 2 * Math.PI,
        rotatie: 0,
        //ca sa fac naveta sa continue in directia in care s-a oprit dupa rotatie
        //thrusting = miscare = inaintare
        thrusting: false,
        timpExplozie: 0,//initial e 0 pt ca nu explodeaza
        nr_blink: Math.ceil(TIMP_REFACERE / TIMP_BLINK), // o sa fie 15 on si 15 off
        blink: Math.ceil(TIMP_BLINK * fps), //0.1 sec * 30 cadre pe sec => 3 sec de vulnerabilitate
        shoot: true, // poate sa traga cu lasere-> adevarat initial
        lasere: [], //ca sa tin nr de lasere trase salvat
        done: false // initial este fals, deoarece racheta exista si are 5 vieti == daca e true, atunci jocul s-a terminat
    }
}

//creare laser
function shootLaser() {
    //daca racheta poate sa traga si nr de lasere mai mic decat maximul permis
    if (racheta.shoot && racheta.lasere.length < MAX_LASERE) {
        //adaugam un nou laser
        racheta.lasere.push({
            //tragem din varful rachetei
            x: racheta.x + 4 / 3 * racheta.r * Math.cos(racheta.u),
            y: racheta.y - 4 / 3 * racheta.r * Math.sin(racheta.u),
            //viteza de deplasare
            xv: VITEZA_LASER * Math.cos(racheta.u) / fps,
            yv: -VITEZA_LASER * Math.sin(racheta.u) / fps,
            distanta: 0 //distanta parcursa initial e 0
        });
    }

    //dupa crearea celor 3 lasere -> nu mai poate sa traga
    racheta.shoot = false;
}

//functie prin care redesenez racheta cadru cu cadru ->miscarea de baza a rachetei -> viteza este constanta
function draw() {
    if (dreapta) {
        racheta.x += THRUST;
    }
    else if (stanga) {
        racheta.x -= THRUST;
    }
    if (jos) {
        racheta.y += THRUST;
    }
    else if (sus) {
        racheta.y -= THRUST;
    }
}

//functie de deplasare a asteroizilor
function moveAsteroid(i) {

    asteroizi[i].x += asteroizi[i].xv;
    asteroizi[i].y += asteroizi[i].yv;
}

//functie pentru a genera parametrii jocului
function newGame() {
    level = 0;
    vieti = VIETI;//5
    scor = 0;
    racheta = createRacheta();

    //cel mai mare scor 
    let scoreString = localStorage.getItem(SAVE_KEY);
    if (scoreString == null) {
        scorH = 0;
    }
    else {
        scorH = parseInt(scoreString);
    }

    newLevel();
}

function newLevel() {
    text = "Level " + (level + 1);
    transparentaText = 1.0;
    createAstoroid();
}



function update() {

    //explozie handler
    let explodeaza = racheta.timpExplozie > 0; // daca adevarat => naveta explodeaza
    let blink_;
    if (racheta.nr_blink % 2 == 0) {
        blink_ = true;
    }
    else blink_ = false;


    //creare spatiu
    context.fillRect(0, 0, canv.width, canv.height);
    createBackground();


    //creare asteroid
    let x, y, r, u, n;
    for (let i = 0; i < asteroizi.length; i++) {

        //proprietati
        x = asteroizi[i].x;
        y = asteroizi[i].y;
        u = asteroizi[i].u;
        n = asteroizi[i].n;
        r = asteroizi[i].r;
        asteroidColor(i);

        context.beginPath();
        context.arc(x, y, r, 0, 2 * Math.PI, false);
        context.stroke();
        context.font = '20px Arial';
        context.fillStyle = "white";
        context.textAlign = "center";
        context.fillText(n, x, y);
        context.closePath();
    }


    //miscare de baza racheta
    if (racheta.thrusting && !racheta.done) {
        draw();
    }


    //creare nava
    if (!explodeaza) {
        if (blink_ && !racheta.done) {
            context.strokeStyle = "white";
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo( //varful rachetei
                racheta.x + 4 / 3 * racheta.r * Math.cos(racheta.u),
                racheta.y - 4 / 3 * racheta.r * Math.sin(racheta.u)
            );

            context.lineTo( //linia spre stanga
                racheta.x - racheta.r * (2 / 3 * Math.cos(racheta.u) + Math.sin(racheta.u)),
                racheta.y + racheta.r * (2 / 3 * Math.sin(racheta.u) - Math.cos(racheta.u))
            );

            context.lineTo( //linia spre dreapta
                racheta.x - racheta.r * (2 / 3 * Math.cos(racheta.u) - Math.sin(racheta.u)),
                racheta.y + racheta.r * (2 / 3 * Math.sin(racheta.u) + Math.cos(racheta.u))
            );

            context.closePath();
            context.stroke();
        }

        //blink handler
        if (racheta.nr_blink > 0) {
            //reducem timpul de blink
            racheta.blink--;
            //reducem nr de blink
            if (racheta.blink == 0) {
                racheta.blink = Math.ceil(TIMP_BLINK * fps);
                racheta.nr_blink--;
            }
        }

    }
    //constructie explozie
    else {
        context.fillStyle = "red";
        context.beginPath();
        context.arc(racheta.x, racheta.y, racheta.r * 1.7, 0, Math.PI * 2, false);
        context.fill();
        context.fillStyle = "orange";
        context.beginPath();
        context.arc(racheta.x, racheta.y, racheta.r * 1.4, 0, Math.PI * 2, false);
        context.fill();
        context.fillStyle = "yellow";
        context.beginPath();
        context.arc(racheta.x, racheta.y, racheta.r * 0.9, 0, Math.PI * 2, false);
        context.fill();
        context.fillStyle = "white";
        context.beginPath();
        context.arc(racheta.x, racheta.y, racheta.r * 0.5, 0, Math.PI * 2, false);
        context.fill();
    }

    //folosita ca sa gestionez coliziunea racheta - asteroid
    if (SHOW_CIRCLE) {
        context.strokeStyle = "lime";
        context.beginPath();
        context.arc(racheta.x, racheta.y, racheta.r, 0, Math.PI * 2, false);
        context.stroke();
        context.closePath();
    }

    //creare lasere
    for (let i = 0; i < racheta.lasere.length; i++) {
        context.fillStyle = "white";
        context.beginPath();
        context.arc(racheta.lasere[i].x, racheta.lasere[i].y, 3, 0, Math.PI * 2, false);
        context.fill();
    }

    //textul de inceput de nivel
    if (transparentaText >= 0) {
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "rgba(255 ,255 ,255, " + transparentaText + ")";
        context.font = '50px Arial';
        context.fillText(text, (canv.width / 2), canv.height * 0.65);
        transparentaText -= (1.0 / TEXT_TIME / fps);
    }
    //restart game
    else if (racheta.done) {
        newGame();
    }

    //creare vieti
    for (let i = 0; i < vieti; i++) {
        drawIconShip(DIM_RACHETA + i * DIM_RACHETA * 1.2, DIM_RACHETA, 90 / 180 * Math.PI);
    }

    //creare scor
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "white";
    context.font = '30px Arial';
    context.fillText(scor, canv.width / 2, DIM_RACHETA);

    //creare cel mai mare scor
    context.textAlign = "right";
    context.textBaseline = "middle";
    context.fillStyle = "white";
    context.font = '30px Arial';
    context.fillText("TOP " + scorH, canv.width - DIM_RACHETA / 2, DIM_RACHETA);

    //coliziune laser-asteroid
    let ax, ay, ar, lx, ly;
    //stergem asteroizii impuscati
    for (let i = asteroizi.length - 1; i >= 0; i--) {
        //prop asteroizi
        ax = asteroizi[i].x;
        ay = asteroizi[i].y;
        ar = asteroizi[i].r;
        //parcurgere inversa lasere
        for (let j = racheta.lasere.length - 1; j >= 0; j--) {
            lx = racheta.lasere[j].x;
            ly = racheta.lasere[j].y;
            //detectare coliziune
            if (distantaDintreCoordonate(ax, ay, lx, ly) < ar) {
                //lovitura
                //=> stergem laser
                racheta.lasere.splice(j, 1);
                //=>stergem asteroid
                distrugeAsteroid(i);
                //asteroizi.splice(i, 1);
                break; //pentru ca in momentul in care s-au lovit, nu mai trebuie sa trecem prin lasere 
                //pentru ca asteroidul lovit a fost sters, deci nu mai poate fi lovit de alt laser
            }
        }

    }


    // COLIZIUNE RACHETA ASTEROID miscare racheta
    if (!explodeaza) {

        //COLIZIUNE RACHETA ASTEROID
        //cat timp e vulnerabila, nu explodeaza chiar daca este lovita
        if (racheta.nr_blink == 0 && !racheta.done) {
            for (let i = 0; i < asteroizi.length; i++) {
                //daca adevarat (adica daca distanta dintre cercul rachetei si al asteroidului < suma centrelor => se ating cercurile) 
                if (distantaDintreCoordonate(racheta.x, racheta.y, asteroizi[i].x, asteroizi[i].y) < racheta.r + asteroizi[i].r) {
                    explozie();
                    distrugeAsteroid(i);
                    break;
                }
            }
        }
        //rotire
        //unghiul in care pointeza naveta este calculat prin adaugarea rotatiei
        racheta.u += racheta.rotatie;
        //daca racheta inainteaza = thrust
        if (racheta.thrusting && !racheta.done) {
            draw();
        }

    } else {
        racheta.timpExplozie--;
        if (racheta.timpExplozie == 0) {
            vieti--;
            if (vieti == 0) {
                gameOver();
            } else
                racheta = createRacheta();
        }
    }


    //miscare lasere
    for (i = racheta.lasere.length - 1; i >= 0; i--) {

        //verifica distanta parcursa 
        if (racheta.lasere[i].distanta > DIST_LASER * canv.width) {
            //a parcurs destula distanta
            //stergem din array
            //splice -> modifica sau adauga -> aici sterge => trebuie parcurs invers arrayul pentru ca primul laser o sa parcurga cea mai mare distanta primul (Sau o sa atinga primul targetul de distanta impus)

            racheta.lasere.splice(i, 1);
            continue;//ca sa continue fara sa itereze
        }


        //miscare simpla
        racheta.lasere[i].x += racheta.lasere[i].xv;
        racheta.lasere[i].y += racheta.lasere[i].yv;

        //calcularea distantei parcurse cu radicalul ipotenuzei 
        racheta.lasere[i].distanta += Math.sqrt(Math.pow(racheta.lasere[i].xv, 2) + Math.pow(racheta.lasere[i].yv, 2));


        // trece prin peretii canvasului laserul
        if (racheta.lasere[i].x < 0) {
            racheta.lasere[i].x = canv.width;
        } else if (racheta.lasere[i].x > canv.width) {
            racheta.lasere[i].x = 0;
        }
        if (racheta.lasere[i].y < 0) {
            racheta.lasere[i].y = canv.height;
        } else if (racheta.lasere[i].y > canv.height) {
            racheta.lasere[i].y = 0;
        }
    }

    //miscare asteroizi
    for (let i = 0; i < asteroizi.length; i++) {
        moveAsteroid(i);

        //trece prin pereti asteroidul
        if (asteroizi[i].x < 0 - asteroizi[i].r) {
            asteroizi[i].x = canv.width + asteroizi[i].r;
        }
        else if (asteroizi[i].x > canv.width + asteroizi[i].r) {
            asteroizi[i].x = 0 - asteroizi[i].r
        }

        if (asteroizi[i].y < 0 - asteroizi[i].r) {
            asteroizi[i].y = canv.height + asteroizi[i].r;
        }
        else if (asteroizi[i].y > canv.height + asteroizi[i].r) {
            asteroizi[i].y = 0 - asteroizi[i].r
        }
    }

    //pt a trece prin peretii canvasului racheta
    if (racheta.x < 0 - racheta.r) {
        racheta.x = canv.width + racheta.r;
    } else if (racheta.x > canv.width + racheta.r) {
        racheta.x = 0 - racheta.r;
    }

    if (racheta.y < 0 - racheta.r) {
        racheta.y = canv.height + racheta.r;
    } else if (racheta.y > canv.height + racheta.r) {
        racheta.y = 0 - racheta.r;
    }



    //tratare coliziune asteroizi
    // for (let i = 0; i < asteroizi.length; i++) {
    //     for (let j = i + 1; j < asteroizi.length; j++) {
    //         if (distantaDintreCoordonate(asteroizi[i].x, asteroizi[i].y, asteroizi[j].x, asteroizi[j].y) < asteroizi[i].r + asteroizi[j].r) {
    //             asteroizi[i].xv = asteroizi[i].xv * (-1);
    //             asteroizi[i].yv = asteroizi[i].yv * (-1);
    //             asteroizi[j].xv = asteroizi[j].xv * (-1);
    //             asteroizi[j].yv = asteroizi[j].yv * (-1);
    //         }
    //     }
    // }



}

