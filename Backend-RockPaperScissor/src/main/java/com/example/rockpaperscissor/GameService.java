package com.example.rockpaperscissor;

import org.springframework.stereotype.Service;
import java.util.Random;

@Service
public class GameService {
    private int playerScore = 0;
    private int computerScore = 0;

    public GameResult play(String playerChoice) {
        String computerChoice = getComputerChoice();
        String result = determineWinner(playerChoice, computerChoice);
        return new GameResult(playerChoice, computerChoice, result);
    }

    private String getComputerChoice() {
        String[] choices = {"Stein", "Papier", "Schere"};
        return choices[new Random().nextInt(choices.length)];
    }

    private String determineWinner(String player, String computer) {
        if (player.equals(computer)) {
            return "Unentschieden!";
        } else if ((player.equals("Schere") && computer.equals("Papier")) ||
                (player.equals("Stein") && computer.equals("Schere")) ||
                (player.equals("Papier") && computer.equals("Stein"))) {
            playerScore++;
            return "Du gewinnst!";
        } else {
            computerScore++;
            return "Computer gewinnt!";
        }
    }

    public String getScore() {
        return "Spieler: " + playerScore + ", Computer: " + computerScore;
    }
}
