'use strict'

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

let Cell = React.createClass({
  handleCellClicked: function() {
    this.props.onCellClick(this.props.row, this.props.col);
  },
  render: function() {
    return (
      <div className={[(
          this.props.color == CELLCOLOR.EMPTY ? 'empty' :
          this.props.color == CELLCOLOR.WHITE ? 'white' :
          'black'
        ), 'field-cell'].join(' ')} onClick={this.handleCellClicked} ref="cont">
      </div>
    );
  }
});

let GameField = React.createClass({
  computerChoicedAzureMLTypeFieldColors: [],
  humanChoicedAzureMLTypeFieldColors: [],
  getInitialFieldColors: function() {
    let fieldColors = [];
    for(let i = 0; i < 8; ++i) {
      let cols = [];
      for(let j = 0; j < 8; ++j) cols.push(0);
      fieldColors.push(cols);
    }
    fieldColors[3][3] = fieldColors[4][4] = CELLCOLOR.WHITE;
    fieldColors[3][4] = fieldColors[4][3] = CELLCOLOR.BLACK;
    return fieldColors;
  },
  getInitialState: function() {
    return {
      fieldColors: this.getInitialFieldColors(),
      turn: PLAYER.HUMAN,
      gameState: GAMESTATE.PROGRESS
    };
  },
  getChangedFieldColors: function(originalFieldColors, y, x, placedColor) {
    let dx = [1, 1, 1, 0, 0, -1, -1, -1];
    let dy = [1, 0, -1, 1, -1, 1, 0, -1];
    let fieldColors = clone(originalFieldColors);
    for(let i = 0; i < 8; ++i) {
      let toggleColors = (function(y, x) {
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
  },
  isPlaceable: function(fieldColors, y, x, placedColor) {
    if(fieldColors[y][x] != CELLCOLOR.EMPTY) return false;
    let dx = [1, 1, 1, 0, 0, -1, -1, -1];
    let dy = [1, 0, -1, 1, -1, 1, 0, -1];
    let ans = false;
    for(let i = 0; i < 8; ++i) {
      let reg = (function(y, x, depth) {
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
  },
  getAzureMLTypeFieldColors: function(fieldColors) {
    let flatArray = [];
    for(let row of fieldColors) {
      flatArray = flatArray.concat(
        row.map(function(num) {
          return num.toString()
        })
      );
    }
    return flatArray;
  },
  fetchMLResults: function(fieldColorss) {
    // TODO: solve security problem (Is CORS Control unsafe?)
    const APIURL = 'https://a1x87i27wk.execute-api.us-west-2.amazonaws.com/bridgeForAzureMLStage/';
    let self = this;
    let postData = {
      Inputs: {
        input1: {
          ColumnNames: (function() {
            return Array(64).fill().map(function(v, i) {
              return `Cell${Math.floor(i / 8)}${i % 8}`;
            });
          })().concat(['Result']),
          Values: fieldColorss.map(function(fieldColors) {
            return self.getAzureMLTypeFieldColors(fieldColors).concat(['0']);
          })
        }
      },
      GlobalParameters: {}
    };
    let postBody = JSON.stringify({
      data: postData
    });
    console.log(postData);
    return fetch(APIURL, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': APIKEY
      },
      body: postBody
    }).then(function(response) {
      return response.json();
    }).then(function(obj) {
      return Promise.resolve(obj['Results']['output1']['value']['Values'].map(function(value) {
        return {
          scoredLabel: Number(value[1]),
          scoredProbability: Number(value[2])
        };
      }));
    });
  },
  getPosition: function(y, x) {
    return {
      y: y,
      x: x
    };
  },
  getPlaceablePositions: function(fieldColors, placedColor) {
    let ans = [];
    for(let y = 0; y < 8; ++y) for(let x = 0; x < 8; ++x) {
      if(this.isPlaceable(fieldColors, y, x, placedColor)) {
        console.log(`placeable: ${y}, ${x}`);
        ans.push(this.getPosition(y, x));
      }
    }
    return ans;
  },
  place: function(y, x) {
    let player = this.state.turn;
    let placedColor = this.getPlacedColor(player);
    let changedFieldColors = this.getChangedFieldColors(this.state.fieldColors, y, x, placedColor);
    this.setState({
      fieldColors: changedFieldColors
    });
    let self = this;
    // ( bad parts
    this.forceUpdate(function() {
      let gameState = self.getGameState(self.state.fieldColors);
      if(gameState == GAMESTATE.PROGRESS) {
        self.changeTurnTo((player == PLAYER.COMPUTER ? PLAYER.HUMAN : PLAYER.COMPUTER));
      } else {
        console.log('gameset', self.getWinner(self.state.fieldColors));
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
  },
  pass: function() {
    console.log('pass');
    this.props.onAlert('PASS!', this.state.turn);
    let self = this;
    // ( BAD PART
    this.forceUpdate(function() {
      self.changeTurnTo((this.state.turn == PLAYER.COMPUTER ? PLAYER.HUMAN : PLAYER.COMPUTER));
    });
  },
  handleCellClicked: function(y, x) {
    if(this.state.turn == PLAYER.HUMAN && this.isPlaceable(this.state.fieldColors, y, x, this.getPlacedColor(PLAYER.HUMAN))) {
      this.place(y, x);
    }
  },
  changeTurnTo: function(turn) {
    if(this.state.turn == turn) return;
    this.setState({
      turn: turn
    });
    if(turn == PLAYER.HUMAN) {
      this.handleTurnChangeToHuman();
    } else {
      this.handleTurnChangeToComputer();
    }
  },
  getGameState: function(fieldColors) {
    let sumOfPlaceablePositions = this.getPlaceablePositions(this.state.fieldColors, CELLCOLOR.BLACK).length + this.getPlaceablePositions(this.state.fieldColors, CELLCOLOR.WHITE).length;
    if(sumOfPlaceablePositions == 0) {
      return GAMESTATE.END;
    } else {
      return GAMESTATE.PROGRESS;
    }
  },
  getWinner: function(fieldColors) {
    let numbersOfBW = [CELLCOLOR.BLACK, CELLCOLOR.WHITE].map(function(color) {
      return fieldColors.map(function(value) {
        return value.filter(function(n) {
          return n == color;
        }).length;
      }).reduce(function(prev, current) {
        return prev + current;
      });
    });
    console.log(numbersOfBW);
    if(numbersOfBW[0] == numbersOfBW[1]) {
      return null;
    } else {
      return this.getPlayer((numbersOfBW[0] > numbersOfBW[1] ? CELLCOLOR.BLACK : CELLCOLOR.WHITE));
    }
  },
  getPlacedColor: function(turn) {
    return (turn == PLAYER.HUMAN ? CELLCOLOR.WHITE : CELLCOLOR.BLACK);
  },
  getPlayer: function(color) {
    return (color == CELLCOLOR.WHITE ? PLAYER.HUMAN : PLAYER.COMPUTER);
  },
  handleTurnChangeToHuman: function() {
    this.computerChoicedAzureMLTypeFieldColors.push(this.getAzureMLTypeFieldColors(this.state.fieldColors));
    console.log(this.getPlaceablePositions(this.state.fieldColors, this.getPlacedColor(PLAYER.HUMAN)));
    if(this.getPlaceablePositions(this.state.fieldColors, this.getPlacedColor(PLAYER.HUMAN)).length == 0) this.pass();
  },
  getConfidenceLevel: function(computerWinProbability) {
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
  },
  handleTurnChangeToComputer: function() {
    console.log('handleTurnChangeToComputer');
    this.props.onUpdateMLConfidenceLevel(0);
    this.humanChoicedAzureMLTypeFieldColors.push(this.getAzureMLTypeFieldColors(this.state.fieldColors));
    let placedColor = this.getPlacedColor(PLAYER.COMPUTER);
    let placeablePositions = this.getPlaceablePositions(this.state.fieldColors, placedColor);
    if(placeablePositions.length == 0) {
      this.pass();
      return;
    }
    let self = this;
    this.fetchMLResults(placeablePositions.map(function(position) {
      return self.getChangedFieldColors(self.state.fieldColors, position.y, position.x, placedColor);
    })).then(function(results) {
      console.log(results);
      let computerWinProbabilities = results.map(function(value) {
        return Number(value.scoredProbability) * (value.scoredLabel == '1' ? 1 : -1);
      });
      // setting new field has max computerWinProbability
      let maxComputerWinProbability = Math.max.apply(null, computerWinProbabilities);
      let computerPlacePosition = placeablePositions[computerWinProbabilities.indexOf(maxComputerWinProbability)];
      console.log(maxComputerWinProbability);
      self.props.onUpdateMLConfidenceLevel(self.getConfidenceLevel(maxComputerWinProbability));
      self.place(computerPlacePosition.y, computerPlacePosition.x);
      // regist changes
      console.log(self.computerChoicedAzureMLTypeFieldColors, self.humanChoicedAzureMLTypeFieldColors);
    });
  },
  sendTrainData: function(winner) {
    console.log('sendTrainData');
    const APIURL = 'https://a1x87i27wk.execute-api.us-west-2.amazonaws.com/bridgeForAzureMLStage/train-data';
    let postBody = this.computerChoicedAzureMLTypeFieldColors.map(function(value) {
      return value.concat([(winner == PLAYER.COMPUTER ? '1' : '0')]);
    }).concat(this.humanChoicedAzureMLTypeFieldColors.map(function(value) {
      return value.map(function(n) {
        return (n == '1' ? '2' : n == '2' ? '1' : '0');
      }).concat([(winner == PLAYER.HUMAN ? '1' : '0')]);
    }));
    console.log('traindata:', postBody);
    fetch(APIURL, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': APIKEY
      },
      body: JSON.stringify(postBody)
    });
  },
  render: function() {
    let rows = [];
    for(let i = 0; i < 8; ++i) {
      let cols = [];
      for(let j = 0; j < 8; ++j) {
        cols.push(
          <td>
            <Cell row={i} col={j} color={this.state.fieldColors[i][j]} onCellClick={this.handleCellClicked} />
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
});

let documentReadyPromise = new Promise(function(resolve, reject) {
  if(document.readyState == 'complete') resolve();
  document.addEventLisener('DOMContentLoaded', function(){
    resolve();
  });
});

let MessageWindow = React.createClass({
  render: function() {
    let messageLayerElement = (
      <div className="message-layer" key={this.props.message}>
        <div className={['message-text-box'].concat((
          this.props.saidPlayer == PLAYER.HUMAN ? ['said-human']
          : ['said-computer']
        ))}>
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
});

let MLFace = React.createClass({
  render: function() {
    return (
      <div className="mlface-box">
        <span className="mlface">{FACE[this.props.MLConfidenceLevel]}</span>
      </div>
    );
  }
});

let CSSTransitionGroup = React.addons.CSSTransitionGroup;

let GameContainer = React.createClass({
  getInitialState: function() {
    return {
      isMessageWindowHidden: true,
      alertMessage: ''
    };
  },
  handleAlert: function(message, saidPlayer) {
    this.setState({
      alertMessage: message,
      alertMessageSaidPlayer: saidPlayer,
      isMessageWindowHidden: false,
      MLConfidenceLevel: 0
    });
    let self = this;
    setTimeout(function() {
      self.setState({
        isMessageWindowHidden: true
      });
    }, 4000);
  },
  handleUpdateMLConfidenceLevel: function(MLConfidenceLevel) {
    this.setState({
      MLConfidenceLevel: MLConfidenceLevel
    });
  },
  render: function() {
    return (
      <div className="game-container">
        <MLFace MLConfidenceLevel={this.state.MLConfidenceLevel} />
        <GameField onAlert={this.handleAlert} onUpdateMLConfidenceLevel={this.handleUpdateMLConfidenceLevel} />
        <MessageWindow message={this.state.alertMessage} saidPlayer={this.state.alertMessageSaidPlayer} MLConfidenceLevel={this.state.MLConfidenceLevel} hidden={this.state.isMessageWindowHidden} />
      </div>
    );
  }
});

documentReadyPromise.then(function() {
  React.render(
    (
      <GameContainer />
    ),
    document.querySelector('.game')
  );
});
