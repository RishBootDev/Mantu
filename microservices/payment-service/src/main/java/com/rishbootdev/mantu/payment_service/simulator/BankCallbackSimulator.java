package com.rishbootdev.mantu.payment_service.simulator;


import com.rishbootdev.mantu.common_library.enums.ChaosMode;
import com.rishbootdev.mantu.common_library.enums.PaymentStatus;
import com.rishbootdev.mantu.common_library.util.RandomizerUtil;
import com.rishbootdev.mantu.payment_service.entity.Payment;
import com.rishbootdev.mantu.payment_service.repository.PaymentRepository;
import com.rishbootdev.mantu.payment_service.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class BankCallbackSimulator {

    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;
    private final SimulatorConfig simulatorConfig;

    @Scheduled(fixedDelayString = "${payment.simulator.poll-interval-ms:5000}")
    @SchedulerLock(name = "payment-service-bank-callback-simulator", lockAtMostFor = "10s", lockAtLeastFor = "1s")

    public void processCallbacks() {

        LocalDateTime globalWindow = LocalDateTime.now().minusSeconds(1);

        List<Payment> candidates = paymentRepository
                .findByStatusAndCreatedAtBefore(PaymentStatus.AUTHORIZING, globalWindow);

        log.info("Simulating payment for payments: {}", candidates.size());

        if(candidates.isEmpty()) return;

        for(Payment payment : candidates){
            simulateCallback(payment);
        }

    }



    private void simulateCallback(Payment payment) {

         SimulatorConfig.MethodSimulatorConfig methodConfig = simulatorConfig.configFor(payment.getMethod());

         LocalDateTime dueAt = dueAt(payment, methodConfig);

         if(LocalDateTime.now().isBefore(dueAt)){
             return;
         }

         ChaosMode chaosMode = simulatorConfig.getChaosMode();

         switch (chaosMode){
             case SUCCESS -> resolve(payment, true);
             case FAILURE -> resolve(payment, false);
             case TIMEOUT -> {
                 log.debug("BankCallback simulator: Payment Timed Out");
             }
             case NORMAL, SLOW -> resolve(payment, shouldApprove(payment, methodConfig));
         }

    }

    private void resolve(Payment payment, Boolean approve){

        if(approve){
            String bankRef = "SIM_BANK_REF"+ RandomizerUtil.randomBase64(8);
            paymentService.resolveAuthorization(payment.getId(), true, bankRef, null, null);
        }else{
            paymentService.resolveAuthorization(payment.getId(), false, null, "SIM_BANK_ERROR_CODE", "Simulated Bank Declined");
        }

    }

    private boolean shouldApprove(Payment payment, SimulatorConfig.MethodSimulatorConfig methodConfig){

        int bucket = Math.abs(payment.getId().hashCode()) % 100;
        return bucket < methodConfig.getSuccessRate();

    }

    private LocalDateTime dueAt(Payment payment, SimulatorConfig.MethodSimulatorConfig methodConfig){

        int range = methodConfig.getMaxDelaySeconds() - methodConfig.getMinDelaySeconds();
        int delaySeconds = methodConfig.getMinDelaySeconds()+Math.abs(payment.getId().hashCode()) % (range+1);

        if(simulatorConfig.getChaosMode() == ChaosMode.SLOW) {
            delaySeconds *= 2;
        }

        return payment.getCreatedAt().plusSeconds(delaySeconds);


    }

}
