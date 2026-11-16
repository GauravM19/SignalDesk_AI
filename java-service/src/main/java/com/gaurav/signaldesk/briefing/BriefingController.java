package com.gaurav.signaldesk.briefing;

import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController @RequestMapping("/api/briefings")
public class BriefingController {
  private final List<Briefing> briefings = new CopyOnWriteArrayList<>(List.of(
    new Briefing("Your morning briefing", "AI & Industry", "Five stories condensed into the decisions worth discussing today.", "08:00", "READY")
  ));
  @GetMapping("/today") public List<Briefing> today(){return briefings;}
  @PostMapping public Briefing create(@RequestBody CreateBriefing request){var b=new Briefing(request.title(),request.topic(),"Scheduled briefing will be generated from your connected sources.",request.time(),"SCHEDULED"); briefings.add(b); return b;}
  public record CreateBriefing(String title,String topic,String time){}
  public record Briefing(String title,String topic,String summary,String deliveryTime,String status){public String id(){return UUID.randomUUID().toString();} public Instant generatedAt(){return Instant.now();}}
}
