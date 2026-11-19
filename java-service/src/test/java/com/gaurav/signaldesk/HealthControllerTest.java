package com.gaurav.signaldesk;

import com.gaurav.signaldesk.briefing.BriefingController;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HealthControllerTest {
  @Test
  void healthIsOk() {
    assertEquals("ok", new HealthController().health().get("status"));
  }

  @Test
  void briefingRejectsInvalidDeliveryTime() {
    try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
      Validator validator = factory.getValidator();
      var request = new BriefingController.CreateBriefing("Daily AI", "AI & Industry", "8am");

      var violations = validator.validate(request);

      assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("HH:mm")));
    }
  }

  @Test
  void briefingAcceptsValidDeliveryTime() {
    try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
      Validator validator = factory.getValidator();
      var request = new BriefingController.CreateBriefing("Daily AI", "AI & Industry", "08:30");

      assertFalse(validator.validate(request).stream()
        .anyMatch(v -> v.getPropertyPath().toString().equals("time")));
    }
  }
}
