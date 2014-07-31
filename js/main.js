// game vars
var gameInterval,
    score = 0,
    isPlaying,
    paused,
    isKeyDown,
    lastX,
    lastY,
    isSameColumn,
    isSameRow,

// screen config
    SCREEN_WIDTH = 640,
    SCREEN_HEIGHT = 352,
    CELL_SIZE = 32,
    GRID_WIDTH = SCREEN_WIDTH / CELL_SIZE,
    GRID_HEIGHT = SCREEN_HEIGHT / CELL_SIZE,

// enemies config
    GHOSTS_COUNT = 4,
    GHOSTS_AVATARS = [
        'img/alex.png',
        'img/vladog.png',
        'img/vladok.png',
        'img/petya.png'
    ],

// timestep
    t = 0,
    dt = 10,
    currentTime = (new Date()).getTime(),
    accumulator = 0,

// display surface vars
    canvas = document.createElement("canvas"),
    context = canvas.getContext("2d"),

// buttons
    leftButton, rightButton, upButton, downButton,

// input vars
    leftDown, rightDown, upDown, downDown, isTouch,

// reload image resources
    assetImages = {};

var playerImage = assetImages.player = new Image();
assetImages.player.src = "img/player2.png";

var ghostImage = assetImages.ghost = [];
var i;
for (i = 0; i < GHOSTS_COUNT; i += 1) {
    ghostImage[i] = assetImages.ghost[i] = new Image();
    assetImages.ghost[i].src = GHOSTS_AVATARS[i];
}

var levelImage = assetImages.level = new Image();
assetImages.level.src = "img/map.png";

function init() {
    // CANVAS SET UP
    container = document.createElement("div");
    container.id = "container";
    container.style.width = SCREEN_WIDTH + "px";
    container.style.height = SCREEN_HEIGHT + "px";
    document.body.appendChild(container);
    container.appendChild(canvas);
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;

    // EVENT LISTENERS
    document.addEventListener("keydown", onKeyPress, false);
    document.addEventListener("keyup", onKeyPress, false);
    container.addEventListener("click", onClicked, false);

    // level
    level = new Level(levelImage, context);

    charcontainer = document.createElement("div");
    charcontainer.className = "charcontainer";
    charcontainer.style.width = SCREEN_WIDTH + "px";
    charcontainer.style.height = SCREEN_HEIGHT + "px";
    container.appendChild(charcontainer);

    // player character
    player = new Player(CELL_SIZE, CELL_SIZE, playerImage);
    charcontainer.appendChild(player.domElement);

    // ghost
    ghosts = [];
    for (var i = 1; i <= GHOSTS_COUNT; i++) {
        ghosts.push(new Ghost(CELL_SIZE * (10 + i), CELL_SIZE * (4 + i), ghostImage[i - 1]));
        charcontainer.appendChild(ghosts[i - 1].domElement);
    }

    infobg = document.createElement('div');
    infobg.id = "infobg";
    infobg.className = "info";
    infobg.style.width = SCREEN_WIDTH + 'px';
    infobg.style.height = SCREEN_HEIGHT + 'px';
    container.appendChild(infobg);
    info = document.createElement('div');
    info.id = "info";
    info.className = "info";
    info.style.width = '100%';
    container.appendChild(info);

    scoreContainer = document.createElement('div');
    highScoreContainer = document.createElement('div');

    scoreContainer.id = "score";
    highScoreContainer.id = "highScore";

    scoreContainer.style.width = SCREEN_WIDTH + 'px';

    document.body.appendChild(scoreContainer);
    document.body.appendChild(highScoreContainer);

    player.init();
    for (var i in ghosts) {
        ghosts[i].init();
    }

    if (Modernizr.touch) {
        isTouch = true;
        makeControls();
    }

    showInfo("<p>" + ((isTouch) ? "TOUCH" : "цъкни button") + " to start</p>");

    if (!sessionStorage.highscore) {
        sessionStorage.setItem("highscore", 0);
    }
}

function run() {
    var newTime = (new Date).getTime(),
        deltaTime = newTime - currentTime;

    if (deltaTime > 25) {
        deltaTime = 25;
    }

    currentTime = newTime;
    accumulator += deltaTime;

    while (accumulator >= dt) {
        accumulator -= dt;
        update();
    }
    render();
}

function update() {
    player.update();
    for (var i in ghosts) {
        if(ghosts.hasOwnProperty(i)){
            ghosts[i].update();
        }
        if (player.xp % CELL_SIZE === 0 && player.yp % CELL_SIZE === 0) {
            var cx, cy;
            cx = player.row = player.xp / CELL_SIZE;
            cy = player.column = player.yp / CELL_SIZE;

            if (upDown && player.dirY > -1 && level.cellData[cx][cy - 1] !== 0) {
                player.moveUp();
            } else if (downDown && player.dirY < 1 && level.cellData[cx][cy + 1] !== 0) {
                player.moveDown();
            } else if (leftDown && player.dirX > -1 && level.cellData[cx - 1][cy] !== 0) {
                player.moveLeft();
            } else if (rightDown && player.dirX < 1 && level.cellData[cx + 1][cy] !== 0) {
                player.moveRight();
            } else if (player.dirX === 1 && level.cellData[cx + 1][cy] === 0) {
                player.stopMovement();
            } else if (player.dirX === -1 && level.cellData[cx - 1][cy] === 0) {
                player.stopMovement();
            } else if (player.dirY === 1 && level.cellData[cx][cy + 1] === 0) {
                player.stopMovement();
            } else if (player.dirY === -1 && level.cellData[cx][cy - 1] === 0) {
                player.stopMovement();
            }

            if (level.cellData[cx][cy] === 1) {
                level.pips[cx][cy].munch();
                level.cellData[cx][cy] = 2;

                ++score;

                document.getElementById("score").innerHTML = "Visual Studious изядени: " + score;
                if (score === level.totalPips) {
                    onGameOver(true);
                }
            }

            isSameRow = player.row === ghosts[i].row;
            isSameColumn = player.column === ghosts[i].column;
        }  else {
            if (upDown && player.dirY !== -1 && player.dirX === 0) {
                player.moveUp();
            } else if (downDown && player.dirY !== 1 && player.dirX === 0) {
                player.moveDown();
            } else if (leftDown && player.dirX !== -1 && player.dirY === 0) {
                player.moveLeft();
            } else if (rightDown && player.dirX !== 1 && player.dirY === 0) {
                player.moveRight();
            }
        }

        if (ghosts[i].xp % CELL_SIZE === 0 && ghosts[i].yp % CELL_SIZE === 0) {
            updateGhost(ghosts[i]);

            isSameRow = player.row == ghosts[i].row;
            isSameColumn = player.column == ghosts[i].column;
        }

        if (isSameRow || isSameColumn) {
            var dx = Math.abs(player.xp - ghosts[i].xp);
            var dy = Math.abs(player.yp - ghosts[i].yp);
            var dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < CELL_SIZE) {
                onGameOver(false);
            }
        }
    }
}

function render() {
    player.render();
    for (var i in ghosts)
        ghosts[i].render();
}

function updateGhost(ghostElement) {
    var node,
        playerChangedPos,

        playerCellX = player.row,
        playerCellY = player.column;

    playerChangedPos = (playerCellX !== lastX || playerCellY !== lastY);
    lastX = playerCellX;
    lastY = playerCellY;

    var lastRow = ghostElement.row,
        lastColumn = ghostElement.column,

        cx = ghostElement.row = ghostElement.xp / CELL_SIZE;
        cy = ghostElement.column = ghostElement.yp / CELL_SIZE;

    if (!ghostElement.chasing && (ghostElement.dirX !== 0 || ghostElement.dirY !== 0)) {
        var nextTileFree = false;

        if ((ghostElement.dirY <= -1 && level.cellData[cx][cy - 1] !== 0) ||
            (ghostElement.dirY >= 1 && level.cellData[cx][cy + 1] !== 0) ||
            (ghostElement.dirX <= -1 && level.cellData[cx - 1][cy] !== 0) ||
            (ghostElement.dirX >= 1 && level.cellData[cx + 1][cy] !== 0)) {
            nextTileFree = true;
        }

        if (nextTileFree) return;
    }

    var nodes = [];

    if (level.cellData[cx + 1][cy] !== 0) nodes.push([cx + 1, cy, 1, 0]);
    if (level.cellData[cx - 1][cy] !== 0) nodes.push([cx - 1, cy, -1, 0]);
    if (level.cellData[cx][cy + 1] !== 0) nodes.push([cx, cy + 1, 0, 1]);
    if (level.cellData[cx][cy - 1] !== 0) nodes.push([cx, cy - 1, 0, -1]);

    if (nodes.length === 1) {
        ghostElement.dirX = nodes[0][2];
        ghostElement.dirY = nodes[0][3];
    }
    else if (ghostElement.chasing) {
        var deltaY, deltaX;

        node = nodes[Math.floor(Math.random() * nodes.length)];
        deltaY = player.yp < ghostElement.yp ? -1 : 1;
        deltaX = player.xp < ghostElement.xp ? -1 : 1;
        if (nextTileFree) {
            ghostElement.dirX = deltaX;
            ghostElement.dirY = deltaY;
        } else {
            ghostElement.dirX = nodes[2];
            ghostElement.dirY = nodes[3];
        }
    } else {
        var smallest = Infinity;

        var i = nodes.length;
        while (--i > -1) {
            var dx = Math.abs(playerCellX - nodes[i][0]);
            var dy = Math.abs(playerCellY - nodes[i][1]);
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < smallest && ((nodes[i][0] != lastRow && nodes[i][1] != lastColumn) || playerChangedPos)) {
                smallest = dist;
                node = nodes[i];
            }
        }

        if (node) {
            ghostElement.dirX = node[2];
            ghostElement.dirY = node[3];
        }
    }
}

function onGameOver(complete) {
    stopGame();

    var str;
    if (complete) {
        str = "<h1>You win! There is no отпуска for them!</h1><p>" + ((isTouch) ? "TOUCH" : "цъкни button") + " to eat again</p>";
    }
    else {
        str = "<h1>Payday!!!</h1><br /><br /><p>Give us парите!</p><p>We are going в отпуск на мурету!</p><br /><p>" + ((isTouch) ? "touch" : "цъкни button") + " to eat again</p>";
    }

    showInfo(str);
    container.addEventListener('click', onClicked, false);
    if (isTouch) container.addEventListener("touchstart", onClicked, false);
    container.style.cursor = "pointer";

    var loadHighscore = sessionStorage.highscore;
    if(loadHighscore < score){
        sessionStorage.setItem('highscore', parseInt(score));
    }
    loadHighscore.innerHTML = sessionStorage.highscore;
}

function resetGame() {
    score = 0;
    level.reset();
    player.reset();
    for (var i in ghosts){
        ghosts[i].reset();
    }
}

function showInfo(str) {
    if (str) {
        document.getElementById("info").innerHTML = str;
        info.style.top = (SCREEN_HEIGHT - info.offsetHeight) * 0.5 + "px";
    }

    info.style.opacity = 1;
    infobg.style.opacity = 0.55;
}

function makeControls() {
    var x, y, space;

    document.addEventListener("touchmove", function (e) {
        e.preventDefault();
    }, false);
    document.addEventListener("touchstart", function (e) {
        e.preventDefault();
    }, false);

    w = 120;
    h = 250;

    space = 50;
    buttons = document.createElement("div");
    buttons.id = "container";
    buttons.style.width = SCREEN_WIDTH + "px";
    buttons.style.height = SCREEN_HEIGHT + "px";
    document.body.appendChild(buttons);

    var button;

    button = new KeyButton((SCREEN_WIDTH * 0.5) - (w * 0.5) - w, h - 180);
    leftButton = button.domElement;
    leftButton.addEventListener("touchstart", onKeyPress, false);
    leftButton.addEventListener("touchend", onKeyPress, false);
    buttons.appendChild(leftButton);

    button = new KeyButton((SCREEN_WIDTH * 0.5) + (w * 0.5), h - 180);
    rightButton = button.domElement;
    rightButton.addEventListener("touchstart", onKeyPress, false);
    rightButton.addEventListener("touchend", onKeyPress, false);
    buttons.appendChild(rightButton);

    button = new KeyButton((SCREEN_WIDTH - w) * 0.5, h - 240);
    upButton = button.domElement;
    upButton.addEventListener("touchstart", onKeyPress, false);
    upButton.addEventListener("touchend", onKeyPress, false);
    buttons.appendChild(upButton);

    button = new KeyButton((SCREEN_WIDTH - w) * 0.5, h - 120);
    downButton = button.domElement;
    downButton.addEventListener("touchstart", onKeyPress, false);
    downButton.addEventListener("touchend", onKeyPress, false);
    buttons.appendChild(downButton);

    container.addEventListener("touchstart", onClicked, false);
}

function onClicked(e) {
    container.removeEventListener('click', onClicked, false);
    if (isTouch) container.removeEventListener("touchstart", onClicked, false);
    container.style.cursor = "default";

    startGame();
    info.style.opacity = 0;
    infobg.style.opacity = 0;
}

function onKeyPress(e) {
    if (!isPlaying && !isKeyDown && !paused) onClicked();
    isKeyDown = (isTouch) ? (e.type == "touchstart") : (e.type == "keydown");

    switch ((isTouch) ? e.target : e.keyCode) {
        case KEY_LEFT :
        case leftButton :
            leftDown = isKeyDown;
            break;

        case KEY_RIGHT :
        case rightButton :
            rightDown = isKeyDown;
            break;

        case KEY_UP :
        case upButton :
            upDown = isKeyDown;
            break;

        case KEY_DOWN :
        case downButton :
            downDown = isKeyDown;
            break;
            case KEY_P:
                pauseGame();
                break;
           case KEY_R:
                resumeGame();
                break;
    }
}

function startGame() {
    if (isPlaying) return;
    isPlaying = true;
    document.getElementById("score").innerHTML = "Visual Studious изядени: " + score;
    document.getElementById("highScore").innerHTML = "Рекорд: " + sessionStorage.highscore;
    resetGame();
    gameInterval = setInterval(run, 1);
}

function stopGame() {
    isPlaying = false;
    document.getElementById('music').pause();
    document.getElementById('debelia').play();
    clearInterval(gameInterval);
}

function pauseGame() {
 paused = true;
 document.getElementById("paused").innerHTML = "<h2>(Paused)</h2>";
 return stopGame();
}

function resumeGame() {
 if (isPlaying) return;
 isPlaying = true;
 paused = false;
 document.getElementById('music').play();
 document.getElementById("paused").innerHTML = "<h2>&nbsp;</h2>";
 document.getElementById("score").innerHTML = "Visual Studious изядени: " + score;
 gameInterval = setInterval(run, 1);
}