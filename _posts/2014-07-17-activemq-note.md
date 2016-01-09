---
layout: post
title: "ActiveMQ笔记"
tagline: "ActiveMQ Note"
description: ""
tags: [ActiveMQ, 消息队列, 笔记]
---

实验室的项目需要使用ActiveMQ，目的是为了进行一些耗时间的处理时，不会阻塞程序的主流程。调研ActiveMQ的工作就交给我来做了。

我们使用ActiveMQ，需要达到的目的有这么几个

* 主流程发送消息，不阻塞
* 可用于集群
* 故障恢复
* 负载均衡

从网上看了一些资料，ActiveMQ可以满足我们的要求

## First Step

从[ActiveMQ官网][]下载即可，目前的最新版本是5.10.0。我下载了Windows版本，进入bin目录，运行


    activemq start

即可启动一个ActiveMQ的Broker。注意，需要设置环境变量`JAVA_HOME`。

## 发送接收消息

这一步应该是初接触ActiveMQ最想要做的事情。我们首先需要一个消息的发送者，同时需要一个消息的接受者。不多说，直接贴代码

    // Sender.java
    import javax.jms.Connection;
    import javax.jms.ConnectionFactory;
    import javax.jms.DeliveryMode;
    import javax.jms.Destination;
    import javax.jms.JMSException;
    import javax.jms.MessageProducer;
    import javax.jms.Session;
    import javax.jms.TextMessage;

    import org.apache.activemq.ActiveMQConnection;
    import org.apache.activemq.ActiveMQConnectionFactory;

    public class Sender {
        private static final String HOST = "tcp://localhost:61616"; // ActiveMQ的监听地址，
        
        public static void main(String[] args) throws InterruptedException {
            ConnectionFactory factory; // JMS连接的工厂
            Connection conn = null; // JMS连接
            Session session; // JMS会话
            Destination destination; // 目的地，对于PTP模式，目的地是Queue；对于订阅模式，目的地是Topic
            MessageProducer producer; // 生产者
            
            factory = new ActiveMQConnectionFactory(ActiveMQConnection.DEFAULT_USER, ActiveMQConnection.DEFAULT_PASSWORD, HOST);
            
            try {
                conn = factory.createConnection();
                conn.start(); // 必须显式调用start方法
                session = conn.createSession(true, Session.AUTO_ACKNOWLEDGE);
                
                destination = session.createQueue("Test");
                producer = session.createProducer(destination);
                producer.setDeliveryMode(DeliveryMode.PERSISTENT); // 设置消息持久化
                for (int i = 0;; i+=2) {
                    send(session, producer, i);
                    Thread.sleep(1000);
                }
            } catch (JMSException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            } finally {
                if (conn != null) {
                    try {
                        conn.close();
                    } catch (JMSException e) {
                        // TODO Auto-generated catch block
                        e.printStackTrace();
                    }
                }
            }
        }
        
        static void send(Session session, MessageProducer producer, int label) {
            try {
                String s = "消息: " + label;
                TextMessage msg = session.createTextMessage(s);
                System.out.println("sending: <" + s + ">");
                producer.send(msg);
                session.commit(); // 提交之后，消息才会发送。之后立即进入下一个事务
            } catch (JMSException e) {
                
            }
            
        }
    }


    // Reciever.java
    import javax.jms.Connection;
    import javax.jms.ConnectionFactory;
    import javax.jms.Destination;
    import javax.jms.JMSException;
    import javax.jms.MessageConsumer;
    import javax.jms.Session;
    import javax.jms.TextMessage;

    import org.apache.activemq.ActiveMQConnection;
    import org.apache.activemq.ActiveMQConnectionFactory;

    public class Reciever {
        
        private static final String HOST = "tcp://localhost:61616";
        
        public static void main(String[] args) throws InterruptedException {
            ConnectionFactory factory;
            Connection conn = null;
            Session session = null;
            Destination destination = null;
            MessageConsumer consumer;
            factory = new ActiveMQConnectionFactory(ActiveMQConnection.DEFAULT_USER, ActiveMQConnection.DEFAULT_PASSWORD, HOST);
            try {
                conn = factory.createConnection();
                conn.start();
                session = conn.createSession(false, Session.AUTO_ACKNOWLEDGE);
                destination = session.createQueue("Test");
                consumer = session.createConsumer(destination);
                
                for (;;) {
                    try {
                        TextMessage msg = (TextMessage)consumer.receive(1000);
                        if (msg != null) {
                            System.out.println("recieved: " + msg.getText());
                        }
                        Thread.sleep(3000);
                    } catch (IllegalStateException e) {
                        
                    }
                }
                
            } catch (JMSException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            } finally {
                if (conn != null) {
                    try {
                        conn.close();
                    } catch (JMSException e) {
                        // TODO Auto-generated catch block
                        e.printStackTrace();
                    }
                }
            }
        }
    }

两段代码，非常容易，这里都是使用点对点（PTP）方式，一个消息只能由一个接受者接收并处理。其中使用过的API都是JMS的标准接口，可以查看[JMS的API doc][]来获取更多信息。注释中，有一句“设置消息持久化”，所谓的消息持久化，是指将消息保存介质中，即使broker突然死掉了，重新启动broker之后，也可以获得之前的未处理的消息，持久化的方式在配置文件一节会说到


## 配置文件

有了初步认识之后，再来看看配置文件。我主要关注`broker`这个节点，这个节点的属性`brokerName`应该是唯一的，`dataDirectory`指定了当前broker存放数据（比如持久化的消息）的目录。

### persistenceAdapter节点
这个节点配置消息持久化的方式，有AMQ、KahaDB、JDBC、LevelDB四种，从5.4版本起，KahaDB作为默认持久化方式。其中，JDBC是将消息持久化到数据库，KahaDB和LevelDB是基于文件的本地数据库，而AMQ则是一种文件存储形式。具体可以参考[ActiveMQ持久化方式][]。

### transportConnectors

这个节点配置客户端连接到ActiveMQ Broker的方式。ActiveMQ支持多种连接方式，包括tcp、vm、amqp、stomp、mqtt等多种。一个连接是一个`transportConnector`节点，每个Broker可以配置多个连接，连接最重要的是`uri`属性，其指明了客户端连接Broker时的地址。具体请参见官方文档[Configuring Transports][]。

## 集群

集群分为两种，一种是Master Slave Cluster，另一种是Broker Cluster。

### Master Slave Cluster

主从模式，可以完成故障恢复，但是没有负载均衡的能力，即同一时刻只有一个Broker（Master）在处理，其他的Broker等待（只是复制Master的状态，但是不进行任何处理）。主从模式又可以分为三种

#### Pure Master Savle Cluster

这是最简单的方式，这种方式下，只能有一个Slave Broker。Master无需额外配置，Slave可以采用如下的配置文件

    <broker masterConnectorURI="tcp://masterhost:61617" shutdownOnMasterFailure="false"> 
        ...
        <transportConnectors>
            <transportConnector uri="tcp://slavehost:61616"/>
        </transportConnectors>
    </broker>

其中，`masterConnectorURI`指明了Master，`shutdownOnMasterFailure`指明在Master失效后，Slave是停止还是成为新的Master继续运行。

在客户端连接的时候，应该采用`failover://(tcp://masterhost:61617,tcp://slavehost:61616)?randomize=false`作为URL连接ActiveMQ

#### Shared File System Master Slave

共享文件系统的主从模式，这个模式是多个Broker使用相同的目录作为消息持久化的存储地址，利用文件锁实现主从模式。获得文件锁的Broker是当前的Master，Master失效后，其余的Slave中，获得文件锁的Broker成为新的Master。所有Broker的配置文件中，都需要做如下配置


    <persistenceAdapter>
        <kahaDB directory="/activemq/data"/>
    </persistenceAdapter> 
其中`directory`属性值必须保持相同，可以采用其他的持久化方式


#### JDBC Master Slave
和Shared File System Master Salve相同，只不过是持久化方式改为了数据库，配置如下

    <broker ...>
        <persistenceAdapter>
            <jdbcPersistenceAdapter dataSource="#mysql-ds"/> 
        </persistenceAdapter> 
    </broker>
    <bean id="mysql-ds" class="org.apache.commons.dbcp.BasicDataSource" destroy-method="close">
        <property name="driverClassName" value="com.mysql.jdbc.Driver"/>
        <property name="url" value="jdbc:mysql://localhost:3306/test?relaxAutoCommit=true"/>
        <property name="username" value="username"/>
        <property name="password" value="passward"/>
        <property name="poolPreparedStatements" value="true"/>
    </bean> 
其中`dataSource`指定了数据库源，需要在配置文件中设置一个`id`与之相等的`bean`配置详细的数据库信息。


### Broker Cluster

多个Broker组成网络，这种集群有负载均衡的能力，采用这种方式的集群，在一个Broker失效后，会连接到另外一个Broker上，但是失效的Broker上的消息，在该Broker恢复之前，不能被其他Broker获得并处理。失效的Broker恢复之后，持久化消息恢复，非持久化消息将会丢失。

这种集群有动态发现和静态发现两种配置方式。区别是，静态发现需要配置在配置文件中制定所有的Broker的地址，而动态发现则无需指明，由Broker自己去发现其他的Broker。

静态配置文件如下

    <broker brokerName="receiver" persistent="false" useJmx="false">
        <transportConnectors>
            <transportConnector uri="tcp://localhost:61616"/>
        </transportConnectors>
        <networkConnectors>
            <networkConnector uri="static:(tcp://localhost:61616,tcp://remotehost:61616)"/>
        </networkConnectors>
    </broker> 


此时客户端连接时，应使用`failover://static://(tcp://localhost:61616,tcp://remotehost://61616)`作为URL。

动态配置文件如下

    <broker brokerName="receiver" persistent="false" useJmx="false">
        <transportConnectors>
            <transportConnector uri="tcp://localhost:61616" discoveryUri="multicast://default"/>
        </transportConnectors>
        <networkConnectors>
            <networkConnector uri="multicast://default"/>
        </networkConnectors>
    </broker> 

此时客户端在连接到ActiveMQ时，应使用`discovery://(multicast://default)`作为URL。

## 总结

ActiveMQ作为一个高性能的消息队列，可以满足我们的使用需求，并且，其配置使用都还算简单，没有门槛，这是我最喜欢的地方。

最后，集群一节中，大量参考了[Ac​t​i​v​e​M​Q​集​群​的​使​用​与​配​置][]一文，有关更多的集群配置内容，可以参考。

[ActiveMQ官网]: http://activemq.apache.org
[JMS的API doc]: http://docs.oracle.com/javaee/7/api/
[ActiveMQ持久化方式]: http://blog.csdn.net/xyw_blog/article/details/9128219
[Configuring Transports]: http://activemq.apache.org/configuring-transports.html
[Ac​t​i​v​e​M​Q​集​群​的​使​用​与​配​置]:http://wenku.baidu.com/view/6989622de2bd960590c67760.html