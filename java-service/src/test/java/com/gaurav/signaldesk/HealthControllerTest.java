package com.gaurav.signaldesk;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
class HealthControllerTest { @Test void healthIsOk(){assertEquals("ok",new HealthController().health().get("status"));} }
