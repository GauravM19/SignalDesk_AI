package com.gaurav.signaldesk.source;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "sources")
public class Source {
  @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
  @Column(nullable=false) private String name;
  @Column(nullable=false) private String type;
  @Column(nullable=false, length=1000) private String url;
  @Column(nullable=false) private String status = "READY";
  @Column(nullable=false) private Instant createdAt = Instant.now();
  protected Source() {}
  public Source(String name, String type, String url) { this.name=name; this.type=type; this.url=url; }
  public UUID getId(){return id;} public String getName(){return name;} public String getType(){return type;} public String getUrl(){return url;} public String getStatus(){return status;} public Instant getCreatedAt(){return createdAt;}
}
