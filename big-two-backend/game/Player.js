class Player {
    constructor(name, ws) {
        this.name = name;
        this.hand = [];
        this.score = 0;
        this.ws = ws;
    }

    isValidPlay(cards, currentTurnCards) {
        var isValid = false;
        // Depending on the current turn cards, the player's cards must be of the same rank or suit
        if (currentTurnCards === undefined) { // if it is the first turn
            if (cards.length === 1) { // if the player plays one card
                isValid = true;
            }
            if (cards.length >= 2) {
                // play pairs or consecutive pairs or triplets or consecutive triplets ... (eg. 3 3 4 4 5 5)
                // play consecutive cards (eg. 3 4 5 6)
                if (Player.hasConsecutiveThreePairs(cards) || Player.hasConsecutiveFourPairs(cards) || Player.hasConsecutiveCards(cards) || Player.hasSameRankCards(cards)) {
                    isValid = true;
                }
            } 
        } else { // if the current plays more than two cards
            if (cards.length === currentTurnCards.length) { // if the number of cards played is the same as the number of cards played on the previous turn
                if (currentTurnCards.length >= 2) {
                    // same rank pairs or triplets ... (4 of a kind eg. 4 4 4 4)
                    if (currentTurnCards.every((currentTurnCard) => currentTurnCard.rank === currentTurnCards[0].rank)) { // if the player plays cards of the same rank
                        if (!cards.every((card) => card.rank === cards[0].rank)) {
                            throw new Error('You must play cards of the same rank');
                        }
                    }
                    // consecutive cards (eg. 3 4 5 6)
                    if (Player.hasConsecutiveCards(currentTurnCards)) { // if the player plays consecutive cards
                        if (!Player.hasConsecutiveCards(cards)) {
                            throw new Error('You must play consecutive cards');
                        }
                    }
                    // consecutive pairs or triplets ... (eg. 3 3 4 4 5 5)
                    if (Player.hasConsecutiveThreePairs(currentTurnCards)) {
                        if (!Player.hasConsecutiveThreePairs(cards)) {
                            throw new Error('You must play consecutive cards of the same rank');
                        }
                    }
                    // consecutive pairs or triplets ... (eg. 3 3 4 4 5 5 6 6)
                    if (Player.hasConsecutiveFourPairs(currentTurnCards)) {
                        if (!Player.hasConsecutiveFourPairs(cards)) {
                            throw new Error('You must play consecutive cards of the same rank');
                        }
                    }
                }
                // Final check
                if (!Player.greaterThan(cards[cards.length-1], currentTurnCards[currentTurnCards.length-1])) {
                    throw new Error('You must play greater cards');
                }
            } else {
                // current play a 2
                if (currentTurnCards.length === 1 && currentTurnCards[0].rank === 2) {
                    // invalid when not play 4 same rank card
                    if (cards.length !== 4 || !cards.every((card) => card.rank === 2)) {
                        throw new Error('You must play 4 same rank cards');
                    } else { // 3 consecutive cards of the same rank (eg. 3 3 4 4 5 5)
                        if (cards.every((card, index) => card.rank === cards[0].rank + index && card.rank === cards[0].rank)) {
                            throw new Error('You must play 4 same rank cards');
                        }
                    }

                }
                else if (currentTurnCards.length === 2 && currentTurnCards.every((currentTurnCard) => currentTurnCard.rank === 2)) {
                    if(hasConsecutiveThreePairs(cards) || (hasSameRankCards(cards) && cards.length === 4)) {
                    }else {
                        isValid = false;
                    }
                }
                else if (currentTurnCards.length === 3 && currentTurnCards.every((currentTurnCard) => currentTurnCard.rank === 2)) {
                    if(!hasConsecutiveFourePairs(cards)) {
                        isValid = false;
                    }
                } else {
                    throw new Error('You must play the same number of cards');
                }
            }
            isValid = true;
        }

        return isValid;
    }

    removeCard(cards) {
        for (const card of cards) {
            this.hand.splice(this.hand.findIndex((handCard) => handCard.rank === card.rank && handCard.suit === card.suit), 1);
        }
    }

    
    static greaterThan(card1, card2) {
        var result = true
        if (this.getRankValue(card1.rank) < this.getRankValue(card2.rank)) {
            result = false
        } else if (this.getRankValue(card1.rank) === this.getRankValue(card2.rank)) {
            if (this.getSuitValue(card1.suit) < this.getSuitValue(card2.suit)) {
                result = false
            }
        }
        return result;
    }

    static getRankValue(rank) {
        const rankValues = {
            3: 3,
            4: 4,
            5: 5,
            6: 6,
            7: 7,
            8: 8,
            9: 9,
            10: 10,
            J: 11,
            Q: 12,
            K: 13,
            A: 14,
            2: 15,
            'black joker': 16,
            'red joker': 17
        };
        return rankValues[rank];
    }

    static getSuitValue(suit) {
        const suitValues = {
            spades: 1,
            clubs: 2,
            diamonds: 3,
            hearts: 4
        };
        return suitValues[suit];
    }

    static hasConsecutiveThreePairs(cards) {
        if (cards.length % 2 !== 0 || cards.length != 6) return false;
        for (let i = 0; i < cards.length - 1; i+=2) {
            if (this.getRankValue(cards[i].rank) !== this.getRankValue(cards[i + 1].rank)) {
                return false;
            }
        }
        for (let i = 0; i < 6; i+=2) {
            if (i === 5) break
            if (this.getRankValue(cards[i].rank) !== this.getRankValue(cards[i + 1].rank) - 1) {
                return false;
            }
        }
        return true;
    }

    static hasConsecutiveFourPairs(cards) {
        if (cards.length % 2 !== 0 || cards.length != 8) return false;
        for (let i = 1; i < cards.length - 1; i+=2) {
            if (this.getRankValue(cards[i].rank) !== this.getRankValue(cards[i + 1].rank)) {
                return false;
            }
        }
        for (let i = 1; i < 8; i+=2) {
            if (i === 7) break
            if (this.getRankValue(cards[i].rank) !== this.getRankValue(cards[i + 1].rank) - 1) {
                return false;
            }
        }
        return true;
    }

    // minimum 4 cards
    static hasConsecutiveCards(cards) {
        if (cards.length < 4) {
            return false;
        }
        var result = true;
        for (let i = 0; i < cards.length - 1; i++) {
            if (this.getRankValue(cards[i].rank) !== this.getRankValue(cards[i + 1].rank) - 1) {
                result = false;
                break;
            }
        }
        return result;
    }

    static hasSameRankCards(cards) {
        var result = true;
        for (let i = 0; i < cards.length - 1; i++) {
            if (cards[i].rank !== cards[i+1].rank) {
                result = false;
            }
        }
        return result;
    }
}

module.exports = Player;