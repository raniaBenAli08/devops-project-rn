package com.daoninhthai.hr;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import com.daoninhthai.hr.config.AssistantConfig;

@SpringBootApplication
@EnableConfigurationProperties(AssistantConfig.class)
public class HrAdminPanelApplication {

    public static void main(String[] args) {
        SpringApplication.run(HrAdminPanelApplication.class, args);
    }
}
