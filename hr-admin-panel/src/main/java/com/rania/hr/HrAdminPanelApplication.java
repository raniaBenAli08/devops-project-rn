package com.rania.hr;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import com.rania.hr.config.AssistantConfig;

@SpringBootApplication
@EnableConfigurationProperties(AssistantConfig.class)
public class HrAdminPanelApplication {

    public static void main(String[] args) {
        SpringApplication.run(HrAdminPanelApplication.class, args);
    }
}
