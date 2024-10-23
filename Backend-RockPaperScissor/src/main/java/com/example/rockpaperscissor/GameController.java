package com.example.rockpaperscissor;

import org.springframework.web.bind.annotation.*;
import com.example.rockpaperscissor.GameResult;
import com.example.rockpaperscissor.GameService;
import org.springframework.web.bind.annotation.*;

import java.util.Random;

@RestController
@CrossOrigin(origins = "http://localhost:5501")  // Hier erlaubst du Cross-Origin-Anfragen vom Frontend
@RequestMapping("/api/game")
public class GameController {
    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping("/play")
    public GameResult play(@RequestBody String playerChoice) {
        return gameService.play(playerChoice);
    }

    @GetMapping("/score")
    public String getScore() {
        return gameService.getScore();
    }
}
