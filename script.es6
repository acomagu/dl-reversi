'use strict';

(function() {
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
  ga('create', 'UA-42893688-6', 'auto');
  ga('send', 'pageview');
})();

jQuery.noConflict();

const APIKEY = 'yBRLWcVu3x21fniEh8IcS3hypeQ5BkT96rmFh3Wz';

const CELLCOLOR = {
  EMPTY: 0,
  BLACK: 1,
  WHITE: 2
};

const PLAYER = {
  HUMAN: 0,
  COMPUTER: 1
};

const GAMESTATE = {
  PROGRESS: 0,
  END: 1
};

const FACE = [
  '(*´∀｀*) .｡oO（',
  '(#ﾟДﾟ)',
  '(*ﾉД`*)･ﾟ･。',
  '(ﾉω･､)',
  '(･ω･｀*)',
  '(’ω’)',
  '(。>ω<。)',
  '((о(｡•ω•｡)о))',
  '(*　・´　∀・｀*)'
];

// (Consider about introducing Immutable-js
let clone = function(object) {
  return jQuery.extend(true, (Array.isArray(object) ? [] : {}), object);
};

let CSSTransitionGroup = React.addons.CSSTransitionGroup;

class Cell extends React.Component {
  handleCellClicked() {
    this.props.onCellClick(this.props.row, this.props.col);
  }
  render() {
    return (
      <div className={[(
        this.props.color == CELLCOLOR.EMPTY ? 'empty' :
        this.props.color == CELLCOLOR.WHITE ? 'white' :
        'black'
      ), 'field-cell'].join(' ')} onClick={this.handleCellClicked.bind(this)} keys={this.props.color}>
      </div>
    );
  }
}

class GameField extends React.Component {
  getInitialFieldColors() {
    let fieldColors = [];
    for(let i = 0; i < 8; ++i) {
      let cols = [];
      for(let j = 0; j < 8; ++j) cols.push(0);
      fieldColors.push(cols);
    }
    fieldColors[3][3] = fieldColors[4][4] = CELLCOLOR.WHITE;
    fieldColors[3][4] = fieldColors[4][3] = CELLCOLOR.BLACK;
    return fieldColors;
  }
  constructor(props) {
    super(props);
    this.computerChoicedAzureMLTypeFieldColors = this.humanChoicedAzureMLTypeFieldColors = [];
    this.state = {
      fieldColors: this.getInitialFieldColors(),
      turn: PLAYER.HUMAN,
      gameState: GAMESTATE.PROGRESS
    };
  }
  getChangedFieldColors(originalFieldColors, y, x, placedColor) {
    let dx = [1, 1, 1, 0, 0, -1, -1, -1];
    let dy = [1, 0, -1, 1, -1, 1, 0, -1];
    let fieldColors = clone(originalFieldColors);
    for(let i = 0; i < 8; ++i) {
      let toggleColors = ((y, x) => {
        if(y + dy[i] < 0 || y + dy[i] > 7 || x + dx[i] < 0 || x + dx[i] > 7 || fieldColors[y + dy[i]][x + dx[i]] == CELLCOLOR.EMPTY) {
          return false;
        } else if(fieldColors[y + dy[i]][x + dx[i]] == placedColor) {
          return true;
        } else {
          let chain = toggleColors(y + dy[i], x + dx[i]);
          if(chain) fieldColors[y + dy[i]][x + dx[i]] = placedColor;
          return chain;
        }
      });
      toggleColors(y, x);
    }
    fieldColors[y][x] = placedColor;
    return fieldColors;
  }
  isPlaceable(fieldColors, y, x, placedColor) {
    if(fieldColors[y][x] != CELLCOLOR.EMPTY) return false;
    let dx = [1, 1, 1, 0, 0, -1, -1, -1];
    let dy = [1, 0, -1, 1, -1, 1, 0, -1];
    let ans = false;
    for(let i = 0; i < 8; ++i) {
      let reg = ((y, x, depth) => {
        if(y + dy[i] < 0 || y + dy[i] > 7 || x + dx[i] < 0 || x + dx[i] > 7 || fieldColors[y + dy[i]][x + dx[i]] == CELLCOLOR.EMPTY) {
          return false;
        } else if(depth >= 1 && fieldColors[y + dy[i]][x + dx[i]] == placedColor) {
          return true;
        } else if(fieldColors[y + dy[i]][x + dx[i]] == placedColor) {
          return false;
        } else {
          return reg(y + dy[i], x + dx[i], depth + 1);
        }
      });
      ans |= reg(y, x, 0);
    }
    return ans;
  }
  getAzureMLTypeFieldColors(fieldColors) {
    let flatArray = [];
    fieldColors.forEach(row => {
      flatArray = flatArray.concat(
        row.map(num => num.toString())
      );
    });
    return flatArray;
  }
  fetchMLResults(fieldColorss) {
    // TODO: solve security problem (Is CORS Control unsafe?)
    const APIURL = 'https://a1x87i27wk.execute-api.us-west-2.amazonaws.com/bridgeForAzureMLStage/';
    let self = this;
    let postData = {
      Inputs: {
        input1: {
          ColumnNames: (() =>
            Array(64).fill().map((v, i) =>
              `Cell${Math.floor(i / 8)}${i % 8}`
            )
          )().concat(['Result']),
          Values: fieldColorss.map(fieldColors =>
            self.getAzureMLTypeFieldColors(fieldColors).concat(['0'])
          )
        }
      },
      GlobalParameters: {}
    };
    let postBody = JSON.stringify({
      data: postData
    });
    return fetch(APIURL, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': APIKEY
      },
      body: postBody
    }).then(response =>
      response.json()
    ).then(obj =>
      Promise.resolve(
        obj['Results']['output1']['value']['Values'].map(value =>
          ({
            scoredLabel: Number(value[1]),
            scoredProbability: Number(value[2])
          })
        )
      )
    );
  }
  getPosition(y, x) {
    return {
      y: y,
      x: x
    };
  }
  getPlaceablePositions(fieldColors, placedColor) {
    let ans = [];
    for(let y = 0; y < 8; ++y) for(let x = 0; x < 8; ++x) {
      if(this.isPlaceable(fieldColors, y, x, placedColor)) {
        ans.push(this.getPosition(y, x));
      }
    }
    return ans;
  }
  place(y, x) {
    let player = this.state.turn;
    let placedColor = this.getPlacedColor(player);
    let changedFieldColors = this.getChangedFieldColors(this.state.fieldColors, y, x, placedColor);
    this.setState({
      fieldColors: changedFieldColors
    });
    let self = this;
    // ( bad parts
    this.forceUpdate(() => {
      let gameState = self.getGameState(self.state.fieldColors);
      if(gameState == GAMESTATE.PROGRESS) {
        self.changeTurnTo((player == PLAYER.COMPUTER ? PLAYER.HUMAN : PLAYER.COMPUTER));
      } else {
        let winner = self.getWinner(self.state.fieldColors);
        self.props.onAlert(`${(
          winner == PLAYER.HUMAN ? 'You WIN!' :
          winner == PLAYER.COMPUTER ? 'I WIN!' :
          'DROW...'
        )}`, (
          winner != null ? winner :
          PLAYER.COMPUTER
        ));
        self.sendTrainData(winner);
        self.setState({
          gameState: gameState,
        });
      }
    });
  }
  pass() {
    this.props.onAlert('PASS!', this.state.turn);
    let self = this;
    // ( BAD PART
    this.forceUpdate(() => {
      self.changeTurnTo((this.state.turn == PLAYER.COMPUTER ? PLAYER.HUMAN : PLAYER.COMPUTER));
    });
  }
  handleCellClicked(y, x) {
    if(this.state.turn == PLAYER.HUMAN && this.isPlaceable(this.state.fieldColors, y, x, this.getPlacedColor(PLAYER.HUMAN))) {
      this.place(y, x);
    }
  }
  changeTurnTo(turn) {
    if(this.state.turn == turn) return;
    this.setState({
      turn: turn
    });
    if(turn == PLAYER.HUMAN) {
      this.handleturnChangeToHuman();
    } else {
      this.handleturnChangeToComputer();
    }
  }
  getGameState(fieldColors) {
    let sumOfPlaceablePositions = this.getPlaceablePositions(this.state.fieldColors, CELLCOLOR.BLACK).length + this.getPlaceablePositions(this.state.fieldColors, CELLCOLOR.WHITE).length;
    if(sumOfPlaceablePositions == 0) {
      return GAMESTATE.END;
    } else {
      return GAMESTATE.PROGRESS;
    }
  }
  getWinner(fieldColors) {
    let numbersOfBW = [CELLCOLOR.BLACK, CELLCOLOR.WHITE].map(color =>
      fieldColors.map(value =>
        value.filter(n =>
          n == color
        ).length
      ).reduce((prev, current) =>
        prev + current
      )
    );
    if(numbersOfBW[0] == numbersOfBW[1]) {
      return null;
    } else {
      return this.getPlayer((numbersOfBW[0] > numbersOfBW[1] ? CELLCOLOR.BLACK : CELLCOLOR.WHITE));
    }
  }
  getPlacedColor(turn) {
    return (turn == PLAYER.HUMAN ? CELLCOLOR.WHITE : CELLCOLOR.BLACK);
  }
  getPlayer(color) {
    return (color == CELLCOLOR.WHITE ? PLAYER.HUMAN : PLAYER.COMPUTER);
  }
  handleturnChangeToHuman() {
    this.computerChoicedAzureMLTypeFieldColors.push(this.getAzureMLTypeFieldColors(this.state.fieldColors));
    if(this.getPlaceablePositions(this.state.fieldColors, this.getPlacedColor(PLAYER.HUMAN)).length == 0) this.pass();
  }
  getConfidenceLevel(computerWinProbability) {
    return (
      computerWinProbability < -(3 / 4) ? 1 :
      computerWinProbability < -(2 / 4) ? 2 :
      computerWinProbability < -(1 / 4) ? 3 :
      computerWinProbability < 0 ? 4 :
      computerWinProbability < 1 / 4 ? 5 :
      computerWinProbability < 2 / 4 ? 6 :
      computerWinProbability < 3 / 4 ? 7 :
      8
    );
  }
  handleturnChangeToComputer() {
    this.props.onUpdateMLConfidenceLevel(0);
    this.humanChoicedAzureMLTypeFieldColors.push(this.getAzureMLTypeFieldColors(this.state.fieldColors));
    let placedColor = this.getPlacedColor(PLAYER.COMPUTER);
    let placeablePositions = this.getPlaceablePositions(this.state.fieldColors, placedColor);
    if(placeablePositions.length == 0) {
      this.pass();
      return;
    }
    let self = this;
    this.fetchMLResults(
      placeablePositions.map(position =>
        self.getChangedFieldColors(self.state.fieldColors, position.y, position.x, placedColor)
      )
    ).then(results => {
      let computerWinProbabilities = results.map(value =>
        Number(value.scoredProbability) * (value.scoredLabel == '1' ? 1 : -1)
      );
      // setting new field has max computerWinProbability
      let maxComputerWinProbability = Math.max.apply(null, computerWinProbabilities);
      let computerPlacePosition = placeablePositions[computerWinProbabilities.indexOf(maxComputerWinProbability)];
      console.log(maxComputerWinProbability);
      self.props.onUpdateMLConfidenceLevel(self.getConfidenceLevel(maxComputerWinProbability));
      self.place(computerPlacePosition.y, computerPlacePosition.x);
      // regist changes
    });
  }
  sendTrainData(winner) {
    const APIURL = 'https://a1x87i27wk.execute-api.us-west-2.amazonaws.com/bridgeForAzureMLStage/train-data';
    let postBody = this.computerChoicedAzureMLTypeFieldColors.map(value =>
      value.concat([(winner == PLAYER.COMPUTER ? '1' : '0')])
    ).concat(
      this.humanChoicedAzureMLTypeFieldColors.map(value =>
        value.map(n =>
          (n == '1' ? '2' : n == '2' ? '1' : '0')
        ).concat([(winner == PLAYER.HUMAN ? '1' : '0')])
      )
    );
    fetch(APIURL, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': APIKEY
      },
      body: JSON.stringify(postBody)
    });
  }
  render() {
    let rows = [];
    for(let i = 0; i < 8; ++i) {
      let cols = [];
      for(let j = 0; j < 8; ++j) {
        cols.push(
          <td>
            <Cell row={i} col={j} color={this.state.fieldColors[i][j]} onCellClick={this.handleCellClicked.bind(this)} />
          </td>
        );
      }
      rows.push(<tr>{cols}</tr>);
      this.rows = rows;
    }
    return (
      <div className="gameField">
        <table>{rows}</table>
      </div>
    );
  }
}

let documentReadyPromise = new Promise((resolve, reject) => {
  if(document.readyState == 'complete') resolve();
  document.addEventListener('DOMContentLoaded', () => {
    resolve();
  });
});

class MessageWindow extends React.Component {
  render() {
    let messageLayerElement = (
      <div className="message-layer" key={this.props.message}>
        <div className={['message-text-box'].concat((
          this.props.saidPlayer == PLAYER.HUMAN ? ['said-human']
          : ['said-computer']
        )).join(' ')}>
          <span className="message-face">{FACE[this.props.MLConfidenceLevel]}</span>
          <span className="message-text">{this.props.message}</span>
        </div>
      </div>
    );
    let contentElement = (this.props.hidden ? null : messageLayerElement);
    return (
      <div>
        <CSSTransitionGroup transitionName="message-layer-transition">
          {contentElement}
        </CSSTransitionGroup>
      </div>
    );
  }
}

class MLFace extends React.Component {
  render() {
    return (
      <div className="mlface-box">
        <span className="mlface">{FACE[this.props.MLConfidenceLevel]}</span>
      </div>
    );
  }
}

class GameContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isMessageWindowHidden: true,
      alertMessage: '',
      alertMessageSaidPlayer: PLAYER.COMPUTER,
      MLConfidenceLevel: 0
    };
  }
  handleAlert(message, saidPlayer) {
    this.setState({
      alertMessage: message,
      alertMessageSaidPlayer: saidPlayer,
      isMessageWindowHidden: false,
      MLConfidenceLevel: 0
    });
    let self = this;
    setTimeout(() => {
      self.setState({
        isMessageWindowHidden: true
      });
    }, 3000);
  }
  handleUpdateMLConfidenceLevel(MLConfidenceLevel) {
    this.setState({
      MLConfidenceLevel: MLConfidenceLevel
    });
  }
  render() {
    return (
      <div className="game-container">
        <MLFace MLConfidenceLevel={this.state.MLConfidenceLevel} />
        <GameField onAlert={this.handleAlert.bind(this)} onUpdateMLConfidenceLevel={this.handleUpdateMLConfidenceLevel.bind(this)} />
        <MessageWindow message={this.state.alertMessage} saidPlayer={this.state.alertMessageSaidPlayer} MLConfidenceLevel={this.state.MLConfidenceLevel} hidden={this.state.isMessageWindowHidden} />
      </div>
    );
  }
}

documentReadyPromise.then(() => {
  React.render(
    (
      <GameContainer />
    ),
    document.querySelector('.game')
  );
});
