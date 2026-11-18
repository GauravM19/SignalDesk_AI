package com.gaurav.signaldesk.briefing;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController @RequestMapping("/api/briefings")
public class BriefingController {
  private final List<Briefing> briefings = new CopyOnWriteArrayList<>(List.of(
    new Briefing("Your morning briefing", "AI & Industry", "Five stories condensed into the decisions worth discussing today.", "08:00", "READY")
  ));

  @GetMapping("/today")
  public List<Briefing> today() {
    return briefings;
  }

  @PostMapping
  public Briefing create(@Valid @RequestBody CreateBriefing request) {
    var briefing = new Briefing(
      request.title(),
      request.topic(),
      "Scheduled briefing will be generated from your connected sources.",
      request.time(),
      "SCHEDULED"
    );
    briefings.add(briefing);
    return briefing;
  }

  public record CreateBriefing(
    @NotBlank(message = "title is required") String title,
    @NotBlank(message = "topic is required") String topic,
    @NotBlank(message = "time is required")
    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "time must use HH:mm format")
    String time
  ) {}

  public record Briefing(
    String title,
    String topic,
    String summary,
    String deliveryTime,
    String status
  ) {
    public String id() {
      return UUID.randomUUID().toString();
    }

    public Instant generatedAt() {
      return Instant.now();
    }
  }
}
